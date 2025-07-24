// Utility to format Surah/Ayat messages with Arabic, translation, emojis, and markdown
// Usage: formatSurahAyatMessage({ text, language, t })

interface FormatSurahAyatMessageParams {
  text: string;
  language: string;
  t: (key: string) => string;
}

/**
 * Detects if the message contains a Surah/Ayat and formats it with Arabic, translation, emojis, and markdown.
 * - Arabic always shown first, then translation.
 * - Adds relevant emojis and markdown for readability.
 *
 * @param text - The message text (may contain Surah/Ayat info)
 * @param language - The user's language (e.g., 'en', 'nl', 'tr')
 * @param t - Translation function
 * @returns Markdown-formatted string
 */
export function formatSurahAyatMessage({ text, language, t }: FormatSurahAyatMessageParams): string {
  // Example pattern: "Surah Al-Fatiha, Ayah 1: ﷽ In the name of Allah..."
  // Or: "[AR] ... [TR] ..." or similar
  // We'll use a simple regex to detect Arabic and translation parts

  // Regex for Arabic (basic, covers most Quranic script)
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g;

  // Try to extract Arabic and translation
  const arabicMatch = text.match(arabicRegex);
  let arabic = arabicMatch ? arabicMatch.join(' ') : '';

  // Remove Arabic from text to get translation
  let translation = text.replace(arabicRegex, '').replace(/\s+/g, ' ').trim();

  // Emoji selection
  let emoji = '📖';
  if (/surah|sura|chapter/i.test(text)) emoji = '🕌';
  if (/qibla|direction/i.test(text)) emoji = '🕋';
  if (/prayer|namaz|salah/i.test(text)) emoji = '⏰';

  // Markdown formatting
  let formatted = '';
  if (arabic) {
    formatted += `${emoji} **${arabic}**\n`;
  }
  if (translation) {
    formatted += `> ${translation}`;
  }
  if (!arabic && !translation) {
    // Fallback: just return text
    formatted = text;
  }
  return formatted;
} 