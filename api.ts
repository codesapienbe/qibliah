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

/**
 * Send a message to Groq's LLM API and get a response.
 * @param {string} message - The user message/question.
 * @param {string} apiKey - Your Groq API key.
 * @param {string} [model='mixtral-8x7b-32768'] - Groq model to use (default: mixtral-8x7b-32768).
 * @returns {Promise<string>} - LLM response text.
 */
export async function askGroq(message: string, apiKey: string, model: string = 'qwen/qwen3-32b'): Promise<string> {
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model,
        messages: [
          { role: 'system', content: 'You are a helpful Islamic assistant. Answer with references to Quran and Hadith when possible.' },
          { role: 'user', content: message }
        ],
        max_tokens: 512,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    // Groq returns OpenAI-compatible response
    return response.data.choices[0].message.content.trim();
  } catch (error: any) {
    throw new Error('Groq API error: ' + (error.response?.data?.error?.message || error.message));
  }
}

/**
 * Send a chat history to Groq's LLM API and get a response.
 * @param {Array<{role: string, content: string}>} chatHistory - The chat history as OpenAI-style messages.
 * @param {string} apiKey - Your Groq API key.
 * @param {string} [model='qwen/qwen3-32b'] - Groq model to use.
 * @returns {Promise<string>} - LLM response text.
 */
export async function askGroqWithHistory(chatHistory: Array<{role: string, content: string}>, apiKey: string, model: string = 'qwen/qwen3-32b'): Promise<string> {
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model,
        messages: chatHistory,
        max_tokens: 512,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.choices[0].message.content.trim();
  } catch (error: any) {
    throw new Error('Groq API error: ' + (error.response?.data?.error?.message || error.message));
  }
} 