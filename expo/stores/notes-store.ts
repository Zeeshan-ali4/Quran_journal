import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { UserNote } from '@/types/quran';

interface NotesStore {
  notes: UserNote[];
  addNote: (payload: Omit<UserNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, patch: Partial<Pick<UserNote, 'content' | 'tags'>>) => void;
  deleteNote: (id: string) => void;
  notesForAyah: (surahNumber: number, ayahNumber: number) => UserNote[];
  searchNotes: (query: string) => UserNote[];
}

const noteId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useNotesStore = create<NotesStore>()(
  persist(
    (set, get) => ({
      notes: [],
      addNote: (payload) =>
        set((state) => {
          const now = new Date().toISOString();
          return { notes: [{ id: noteId(), createdAt: now, updatedAt: now, ...payload }, ...state.notes] };
        }),
      updateNote: (id, patch) =>
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n)),
        })),
      deleteNote: (id) => set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),
      notesForAyah: (surahNumber, ayahNumber) =>
        get().notes.filter((n) => n.referenceType === 'ayah' && n.surahNumber === surahNumber && n.ayahNumber === ayahNumber),
      searchNotes: (query) => {
        const q = query.trim().toLowerCase();
        if (!q) return get().notes;
        return get().notes.filter((n) => n.content.toLowerCase().includes(q) || n.tags.some((t) => t.toLowerCase().includes(q)));
      },
    }),
    { name: 'quran-journal-user-notes', storage: createJSONStorage(() => AsyncStorage) }
  )
);
