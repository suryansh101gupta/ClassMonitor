import os
from google import genai

os.environ["GOOGLE_API_KEY"] = "AIzaSyAyBpqf_Y-HFaJsYEudJdcAR5GfOLXT2Zo"

client = genai.Client()
model_id = "text-embedding-004"

def get_embedding(text):
    response = client.models.embed_content(
        model=model_id,
        contents=text
    )
    return response.embeddings[0].values

vector = get_embedding("Hello world")
print(f"Vector length: {len(vector)}")
print(f"First 5 values: {vector[:5]}")


from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitter import RecursiveCharacterTextSplitter

## load pdf
loader = PyPDFLoader("https://investors.mongodb.com/node/12236/pdf")
data = loader.load()

##split data into chunks
text_splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=20)
documents = text_splitter.split_documents(data)