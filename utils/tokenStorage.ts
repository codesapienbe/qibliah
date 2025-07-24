import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'groq_api_token';

export async function saveGroqToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getGroqToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function deleteGroqToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
} 