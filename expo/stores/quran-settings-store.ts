import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type TranslationId = 'bundled' | 'en.ahmedali' | 'en.pickthall' | 'en.yusufali' | 'en.maududi';

export const TRANSLATIONS: { id: TranslationId; label: string; author: string }[] = [
  { id: 'bundled', label: 'Muhammad Asad', author: 'Muhammad Asad' },
  { id: 'en.ahmedali', label: 'Ahmed Ali', author: 'Ahmed Ali' },
  { id: 'en.pickthall', label: 'Pickthall', author: 'Mohammed Pickthall' },
  { id: 'en.yusufali', label: 'Yusuf Ali', author: 'Abdullah Yusuf Ali' },
  { id: 'en.maududi', label: 'Maududi', author: 'Sayyid Abul Ala Maududi' },
];

interface QuranSettingsStore {
  translationId: TranslationId;
  showTransliteration: boolean;
  showTafsir: boolean;
  tafsirId: number;
  setTranslation: (id: TranslationId) => void;
  setShowTransliteration: (value: boolean) => void;
  setShowTafsir: (show: boolean) => void;
  setTafsirId: (id: number) => void;
}

export const useQuranSettingsStore = create<QuranSettingsStore>()(
  persist(
    (set) => ({
      translationId: 'bundled',
      showTransliteration: false,
      showTafsir: false,
      tafsirId: 169,
      setTranslation: (id) => set({ translationId: id }),
      setShowTransliteration: (value) => set({ showTransliteration: value }),
      setShowTafsir: (show) => set({ showTafsir: show }),
      setTafsirId: (id) => set({ tafsirId: id }),
    }),
    { name: 'quran-journal-settings', storage: createJSONStorage(() => AsyncStorage) }
  )
);
