// Quran and Ollama API utility
// NOTE: You must install axios: npm install axios
import axios from 'axios';

/**
 * Search the Quran using alquran.cloud API.
 * @param {string} query - The search keyword or question.
 * @param {string} [lang='en'] - Language code for translation.
 * @returns {Promise<any>} - Search results from the Quran API.
 */
export async function searchQuran(query: string, lang: string = 'en'): Promise<any> {
  try {
    const url = `https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/${lang}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    throw new Error('Quran API error: ' + error.message);
  }
}

/**
 * Send a message to a local Ollama LLM (e.g., qwen3:1.7b) and get a response.
 * @param {string} message - The user message/question.
 * @param {string} [endpoint='http://localhost:11434/api/generate'] - Ollama endpoint.
 * @returns {Promise<string>} - LLM response text.
 */
export async function askOllama(message: string, endpoint: string = 'http://localhost:11434/api/generate'): Promise<string> {
  try {
    const response = await axios.post(endpoint, {
      model: 'qwen3:1.7b',
      prompt: message,
      stream: false
    });
    // Adjust this if Ollama returns a different structure
    return response.data.response || response.data;
  } catch (error: any) {
    throw new Error('Ollama API error: ' + error.message);
  }
} 