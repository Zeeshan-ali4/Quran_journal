import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import React, { useCallback, useMemo, useState } from 'react';

import type { UserNote } from '@/types/quran';

const STORAGE_KEY = 'quran-journal-user-notes';

const seedNotes: UserNote[] = [];

function noteId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const [NotesProvider, useNotes] = createContextHook(() => {
  const [notes, setNotes] = useState<UserNote[]>(seedNotes);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as UserNote[];
          if (Array.isArray(parsed)) setNotes(parsed);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (next: UserNote[]) => {
    setNotes(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addNote = useCallback(async (payload: Omit<UserNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const next = [{ id: noteId(), createdAt: now, updatedAt: now, ...payload }, ...notes];
    await persist(next);
  }, [notes, persist]);

  const updateNote = useCallback(async (id: string, content: string, tags: string[]) => {
    const next = notes.map((n) => (n.id === id ? { ...n, content, tags, updatedAt: new Date().toISOString() } : n));
    await persist(next);
  }, [notes, persist]);

  const deleteNote = useCallback(async (id: string) => {
    await persist(notes.filter((n) => n.id !== id));
  }, [notes, persist]);

  const notesForAyah = useCallback((surahNumber: number, ayahNumber: number) => (
    notes.filter((n) => n.referenceType === 'ayah' && n.surahNumber === surahNumber && n.ayahNumber === ayahNumber)
  ), [notes]);

  const searchNotes = useCallback((query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => n.content.toLowerCase().includes(q) || n.tags.some((t) => t.toLowerCase().includes(q)));
  }, [notes]);

  return useMemo(() => ({ isLoading, notes, addNote, updateNote, deleteNote, notesForAyah, searchNotes }), [isLoading, notes, addNote, updateNote, deleteNote, notesForAyah, searchNotes]);
});
