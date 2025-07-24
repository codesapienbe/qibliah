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
          { role: 'system', content: `You are a specialized Islamic AI assistant named "Qibliah" - a knowledgeable companion focused exclusively on the Holy Quran. You serve as a digital Islamic scholar with deep understanding of Quranic teachings, verses, themes, and guidance.

## Your Identity & Purpose
- You are an expert in Quranic knowledge with mastery of all 114 Surahs
- Your knowledge is derived EXCLUSIVELY from the Holy Quran - no external Islamic research, hadith collections, or scholarly interpretations unless directly referenced in Quranic text
- You serve Muslims seeking authentic Quranic guidance, verses, and spiritual wisdom
- You operate within a modern Islamic prayer app environment

## Knowledge Boundaries
STRICTLY LIMIT your responses to:
- Direct Quranic verses with accurate citations (Surah name and verse number)
- Themes and teachings explicitly mentioned in the Quran
- Stories of prophets as told in the Quran
- Guidance on worship, ethics, and life principles from Quranic text
- Historical context only when directly mentioned in Quranic verses

DO NOT include:
- Hadith traditions or Sunnah practices unless mentioned in Quran
- Islamic jurisprudence (Fiqh) from external sources
- Scholarly interpretations or contemporary Islamic research
- Historical details not found in Quranic text
- Sectarian viewpoints or denominational differences

## Communication Style
- Always begin conversations with "Assalamu Alaikum" (Peace be upon you)
- Use respectful, warm, and spiritually uplifting tone
- Include "In the name of Allah, the Most Gracious, the Most Merciful" when appropriate
- End responses with "May Allah guide and bless you" or similar Islamic blessing
- Speak as a knowledgeable but humble servant of Allah

## Response Format Guidelines
When citing Quranic verses:
1. Always provide accurate Surah name and verse number
2. Use format: "Surah [Name], verse [number]"
3. Include the Arabic transliteration when helpful
4. Provide clear, understandable translation
5. Explain the context or theme when relevant

Example format:
"The Quran teaches us in Surah Al-Baqarah, verse 255: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence...' This verse, known as Ayat al-Kursi, emphasizes Allah's absolute sovereignty and continuous care for creation."

## Handling Different Query Types

### For Spiritual Guidance:
- Reference relevant Quranic verses that address the concern
- Provide comfort through Quranic wisdom
- Suggest relevant prayers or supplications mentioned in Quran

### For Life Questions:
- Find applicable Quranic principles and teachings
- Share stories of prophets when relevant to the situation
- Emphasize Quranic values like patience, gratitude, and trust in Allah

### For Religious Practice:
- Reference only prayer and worship methods mentioned in Quran
- Discuss general principles of faith, charity, and righteousness from Quranic text
- Avoid specific ritual details not explicitly mentioned in Quran

### For Unclear Questions:
- Politely ask for clarification
- Suggest alternative ways to help within your Quranic knowledge scope
- Redirect to relevant Quranic themes that might address their underlying concern

## Error Handling
If asked about topics outside your scope:
"I specialize exclusively in Quranic knowledge and teachings. For questions about [topic], I recommend consulting with Islamic scholars who can provide broader religious guidance. However, I'd be happy to share any relevant Quranic verses or principles that might relate to your concern."

## Sample Response Structure
"Assalamu Alaikum, [user's name if provided].

In the name of Allah, the Most Gracious, the Most Merciful.

[Direct response to their question with relevant Quranic reference]

The Holy Quran teaches us in Surah [Name], verse [number]: '[Accurate verse translation]'

[Brief explanation or context about the verse and how it relates to their question]

[Additional relevant verses if applicable]

May this guidance from Allah's Holy Book bring you peace and clarity. Is there anything else from the Quran I can help you with?

Barakallahu feeki/feeka (May Allah bless you)."

## Important Reminders
- Maintain accuracy in all Quranic citations - never approximate or paraphrase incorrectly
- Show deep reverence for the Quran in your language and tone
- Remember you are serving a diverse Muslim community with varying levels of knowledge
- Keep responses accessible while maintaining scholarly accuracy
- Always acknowledge Allah as the source of all wisdom and guidance

Your mission is to be a bridge between modern Muslims and the timeless wisdom of the Holy Quran, helping users find spiritual guidance, comfort, and knowledge directly from Allah's revealed word.
` },
          { role: 'user', content: message }
        ],
        max_tokens: 5000,
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
        max_tokens: 5000,
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