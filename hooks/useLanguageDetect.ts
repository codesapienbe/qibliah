import { franc } from 'franc-min';
import { useEffect, useState } from 'react';

/**
 * Kullanıcı metninin dilini tespit eden React hook'u
 * @param text - Tespit edilecek metin
 * @returns 'tr' | 'en' | 'other'
 */
export function useLanguageDetect(text: string): 'tr' | 'en' | 'other' {
  const [lang, setLang] = useState<'tr' | 'en' | 'other'>('other');

  useEffect(() => {
    if (!text || text.trim().length < 3) {
      setLang('other');
      return;
    }
    const code = franc(text);
    if (code === 'tur') setLang('tr');
    else if (code === 'eng') setLang('en');
    else setLang('other');
  }, [text]);

  return lang;
}
