export type AssistantSource = 'quran' | 'ollama';

export const ASSISTANT_SOURCES: { label: string; value: AssistantSource }[] = [
  { label: 'Quran API', value: 'quran' },
  { label: 'Ollama LLM', value: 'ollama' },
]; 