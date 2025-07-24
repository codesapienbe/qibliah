## Assistant Tab (Quranic AI Assistant)
- [ ] Integrate a real AI/Quran API (e.g., Quran.com API, OpenAI, or custom backend) to answer user questions with real verses and explanations.
- [ ] Persist message history locally using AsyncStorage so users don’t lose their conversation when closing the app.
- [ ] Add voice input: allow users to ask questions via speech using expo-speech or expo-speech-to-text.
- [ ] Add buttons to copy or share AI answers.
- [ ] Highlight Quranic verses or keywords in the AI’s response (rich text/highlighting).

## Prayer Tab
- [ ] Fetch dynamic prayer times based on the user’s location using an API like Aladhan or MuslimSalat.
- [ ] Display the current Hijri date alongside the Gregorian date.
- [ ] Integrate local notifications to remind users before each prayer (using expo-notifications).
- [ ] Allow users to choose their preferred calculation method (ISNA, MWL, Umm al-Qura, etc.).
- [ ] Add subtle animation to the countdown timer for a more engaging UI.

## Calendar Tab
- [ ] Highlight special Islamic dates (Eid, Ramadan, etc.) on the calendar.
- [ ] Allow users to toggle between Hijri and Gregorian calendars.
- [ ] Show actual prayer times for each day (not just static times) when a date is tapped, using the real API.
- [ ] Let users add personal events/reminders to the calendar.

## Qibla Tab
- [ ] Integrate live compass using the device’s magnetometer to show the Qibla direction relative to the user’s orientation (using expo-location or react-native-sensors).
- [ ] Show a map with a line from the user’s location to the Kaaba.
- [ ] Add a tooltip or info button explaining how the Qibla angle is calculated.

## General/All Tabs
- [ ] Let users manually switch between dark and light themes.
- [ ] Improve accessibility: font scaling, color contrast, and add accessibility labels for screen readers.
- [ ] Add multi-language support (Arabic, Turkish, French, etc.) using i18n-js or react-i18next.
- [ ] Show a quick tutorial or onboarding screens for first-time users.