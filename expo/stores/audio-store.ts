import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AudioStore {
  reciterId: string;
  isPlaying: boolean;
  currentSurah: number | null;
  currentAyah: number | null;
  setReciter: (id: string) => void;
  play: (surah: number, ayah: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  nextAyah: (totalAyahs: number) => void;
  prevAyah: () => void;
}

export const useAudioStore = create<AudioStore>()(
  persist(
    (set) => ({
      reciterId: 'ar.alafasy',
      isPlaying: false,
      currentSurah: null,
      currentAyah: null,
      setReciter: (id) => set({ reciterId: id }),
      play: (surah, ayah) => set({ currentSurah: surah, currentAyah: ayah, isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      resume: () => set((state) => (state.currentSurah && state.currentAyah ? { isPlaying: true } : state)),
      stop: () => set({ isPlaying: false, currentSurah: null, currentAyah: null }),
      nextAyah: (totalAyahs) => set((state) => {
        if (!state.currentAyah || !state.currentSurah) {
          return state;
        }

        if (state.currentAyah >= totalAyahs) {
          return { isPlaying: false, currentSurah: null, currentAyah: null };
        }

        return { currentAyah: state.currentAyah + 1, isPlaying: true };
      }),
      prevAyah: () => set((state) => {
        if (!state.currentAyah || !state.currentSurah) {
          return state;
        }

        return { currentAyah: Math.max(1, state.currentAyah - 1), isPlaying: true };
      }),
    }),
    { name: 'quran-journal-audio', storage: createJSONStorage(() => AsyncStorage) }
  )
);
