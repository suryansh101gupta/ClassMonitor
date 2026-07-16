import mongoose from 'mongoose';
import genAI from '../config/gemini.js';

export const askQuestion = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required in the request body.' });
    }

    // 1. Generate text embedding for the user query
    // Using text-embedding-004 to create a vector, implicitly 3072 dimensions in default usage
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const embeddingResult = await embeddingModel.embedContent(query);
    const embeddingVector = embeddingResult.embedding.values;

    // 2. Perform Vector Search in MongoDB
    // Connect to the desired collection
    // Note: ensure you replace 'documents' with your actual collection name
    const collectionName = 'faq'; // <-- Replace with your target collection name
    const collection = mongoose.connection.collection(collectionName);

    const vectorSearchPipeline = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: embeddingVector,
          exact: false,
          numCandidates: 100, // Number of candidates to consider
          limit: 5 // Number of context chunks to return
        }
      },
      {
        $project: {
          _id: 0,
          text: 1, // Adjust projection to match the field containing context text
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ];

    console.log("Executing $vectorSearch pipeline...");
    const searchResults = await collection.aggregate(vectorSearchPipeline).toArray();

    console.log(`Vector search completed. Found ${searchResults.length} relevant documents.`);

    // 3. Construct prompt with retrieved context
    const contextText = searchResults.map(doc => doc.text).join('\n---\n');
    const prompt = `Use the following pieces of context to answer the question at the end. \n\n[Context]\n${contextText}\n\nQuestion: ${query}`;

    // 4. Generate Answer using LLM Model 
    // Using gemini-1.5-flash for response generation
    const llmModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await llmModel.generateContent(prompt);

    let responseText = '';
    // Check if there is valid response text
    if (result.response && result.response.text) {
      responseText = result.response.text();
    } else {
      throw new Error('No valid response from LLM.');
    }

    // 5. Return the response as JSON
    res.json({ answer: responseText });

  } catch (error) {
    console.error('Error processing RAG query:', error);
    res.status(500).json({ error: 'An internal server error occurred while processing the request.' });
  }
};
