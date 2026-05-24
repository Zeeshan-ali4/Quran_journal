import surahList from '@/data/surah-list.json';

export const RECITERS = [
  { id: 'ar.alafasy', label: 'Mishary Alafasy', arabicName: 'مشاري العفاسي' },
  { id: 'ar.abdurrahmaansudais', label: 'Abdul Rahman Al-Sudais', arabicName: 'عبد الرحمن السديس' },
  { id: 'ar.husary', label: 'Mahmoud Khalil Al-Husary', arabicName: 'محمود خليل الحصري' },
  { id: 'ar.minshawi', label: 'Mohamed Siddiq El-Minshawi', arabicName: 'محمد صديق المنشاوي' },
] as const;

export function getAudioUrl(surahNumber: number, ayahNumber: number, reciterId: string): string {
  const surahsBefore = surahList.slice(0, Math.max(0, surahNumber - 1));
  const offset = surahsBefore.reduce((sum, surah) => sum + surah.numberOfAyahs, 0);
  const globalAyahNumber = offset + ayahNumber;
  return `https://cdn.islamic.network/quran/audio/128/${reciterId}/${globalAyahNumber}.mp3`;
}
