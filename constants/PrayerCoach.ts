export type PrayerPose = 'standing' | 'ruku' | 'sujud' | 'sitting';

export interface PrayerStep {
  id: string;
  pose: PrayerPose;
  spokenPromptEn: string;
  spokenPromptAr?: string;
  duaAr?: string[]; // additional Arabic recitations said in this step
  hintEn: string;
}

export interface PrayerRakatTemplate {
  steps: PrayerStep[];
}

// Obligatory Arabic recitations used across steps
export const AR = {
  takbir: 'الله أكبر',
  fatiha:
    'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ. الْحَمْدُ لِلّٰهِ رَبِّ الْعَالَمِينَ. الرَّحْمٰنِ الرَّحِيمِ. مَالِكِ يَوْمِ الدِّينِ. إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ. اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ. صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ، غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ.',
  shortSurahIkhlas:
    'قُلْ هُوَ اللّٰهُ أَحَدٌ. اللّٰهُ الصَّمَدُ. لَمْ يَلِدْ وَلَمْ يُولَدْ. وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ.',
  rukuTasbih: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ',
  samiAllahu: 'سَمِعَ اللّٰهُ لِمَنْ حَمِدَه',
  rabbanaLakalHamd: 'رَبَّنَا لَكَ الْحَمْدُ',
  sujudTasbih: 'سُبْحَانَ رَبِّيَ الأَعْلَى',
  jalsaDua: 'رَبِّ اغْفِرْ لِي',
  tashahhud:
    'التَّحِيَّاتُ لِلّٰهِ، وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللّٰهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللّٰهِ الصَّالِحِينَ. أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ.',
  salawat:
    'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ. اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ.',
  tasleemRight: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللّٰهِ',
  tasleemLeft: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللّٰهِ',
};

// Per-rakat template: Qiyam → Ruku → Stand → Sujud → Sitting → Sujud
export const defaultRakatTemplate: PrayerRakatTemplate = {
  steps: [
    {
      id: 'qiyam',
      pose: 'standing',
      spokenPromptEn: 'Stand and begin.',
      spokenPromptAr: AR.takbir,
      duaAr: [AR.fatiha, AR.shortSurahIkhlas],
      hintEn: 'Standing (Qiyam) with Fatiha and a short surah',
    },
    { id: 'ruku', pose: 'ruku', spokenPromptEn: 'Bow for ruku.', spokenPromptAr: AR.rukuTasbih, hintEn: 'Ruku (bowing)' },
    {
      id: 'i_tidal',
      pose: 'standing',
      spokenPromptEn: 'Stand up straight.',
      spokenPromptAr: `${AR.samiAllahu}. ${AR.rabbanaLakalHamd}`,
      hintEn: 'Standing after ruku',
    },
    { id: 'sujud1', pose: 'sujud', spokenPromptEn: 'Prostrate for sujud.', spokenPromptAr: AR.sujudTasbih, hintEn: 'Sujud (prostration)' },
    { id: 'jalsa', pose: 'sitting', spokenPromptEn: 'Sit calmly. Short pause.', spokenPromptAr: AR.jalsaDua, hintEn: 'Sitting between sujuds' },
    { id: 'sujud2', pose: 'sujud', spokenPromptEn: 'Second sujud.', spokenPromptAr: AR.sujudTasbih, hintEn: 'Sujud (prostration)' },
  ],
};

// Final steps after the last rakat
export const finalSteps: PrayerStep[] = [
  { id: 'tashahhud', pose: 'sitting', spokenPromptEn: 'Sit for Tashahhud.', spokenPromptAr: AR.tashahhud, hintEn: 'Tashahhud' },
  { id: 'salawat', pose: 'sitting', spokenPromptEn: 'Send blessings.', spokenPromptAr: AR.salawat, hintEn: 'Salawat' },
  { id: 'tasleem', pose: 'sitting', spokenPromptEn: 'Finish with Tasleem.', spokenPromptAr: `${AR.tasleemRight}. ${AR.tasleemLeft}`, hintEn: 'Tasleem to right and left' },
];

export type PrayerCoachMode = 'click' | 'listen' | 'watch';

export interface PrayerCoachConfig {
  totalRakat: number;
  autoAdvanceFromPose: boolean;
  language: string; // BCP-47, e.g., 'en-US'
  arabicLanguage?: string; // e.g., 'ar-SA'
  voiceGender?: 'male' | 'female';
  mode?: PrayerCoachMode;
}

export const defaultCoachConfig: PrayerCoachConfig = {
  totalRakat: 2,
  autoAdvanceFromPose: true,
  language: 'en-US',
  arabicLanguage: 'ar-SA',
  voiceGender: 'male',
  mode: 'click',
};

// Rakat counts per obligatory prayer
export const PRAyerRakatByKey: Record<'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha', number> = {
  Fajr: 2,
  Dhuhr: 4,
  Asr: 4,
  Maghrib: 3,
  Isha: 4,
};
