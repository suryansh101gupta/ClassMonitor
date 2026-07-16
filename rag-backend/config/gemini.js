import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey || apiKey === 'your_google_gemini_api_key_here') {
  console.error("Warning: GOOGLE_API_KEY is not configured properly in the .env file.");
}

const genAI = new GoogleGenerativeAI(apiKey || 'dummy_key');

export default genAI;
