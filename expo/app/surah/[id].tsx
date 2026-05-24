import { useLocalSearchParams } from 'expo-router';
import { BookOpen, Languages, MessageSquarePlus, Type } from 'lucide-react-native';
import React, { memo, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { NoteCard } from '@/components/note-card';
import { NoteComposer } from '@/components/note-composer';
import { TafsirPicker } from '@/components/tafsir-picker';
import { TranslationPicker } from '@/components/translation-picker';
import { palette } from '@/constants/colors';
import { REFLECTION_PROMPTS } from '@/constants/reflection-prompts';
import { fetchSurahDetail } from '@/data/api/quran';
import { fetchSurahTafsir } from '@/data/api/tafsir';
import { useNotes } from '@/providers/notes-provider';
import { TRANSLATIONS, useQuranSettingsStore } from '@/stores/quran-settings-store';
import type { NoteTag, UserNote, Verse } from '@/types/quran';

type Selection =
  | { type: 'surah' }
  | { type: 'ayah'; ayahNumber: number }
  | { type: 'word'; ayahNumber: number; wordIndex: number; wordText: string };

type SurahListItem =
  | { type: 'chapterNotes' }
  | { type: 'verse'; verse: Verse }
  | { type: 'ayahNotes' };

const AyahCard = memo(function AyahCard({
  ayahNumber,
  arabic,
  translation,
  transliteration,
  tafsir,
  onAyahPress,
  onWordPress,
  wordHasNotes,
}: {
  ayahNumber: number;
  arabic: string;
  translation: string;
  transliteration?: string;
  tafsir?: string;
  onAyahPress: () => void;
  onWordPress: (wordIndex: number, wordText: string) => void;
  wordHasNotes: Set<number>;
}) {
  const words = useMemo(() => arabic.split(' ').filter(Boolean), [arabic]);
  const [tafsirExpanded, setTafsirExpanded] = useState(false);

  return (
    <View style={styles.ayahCard}>
      <View style={styles.ayahHeader}>
        <View style={styles.ayahNumberBadge}>
          <Text style={styles.ayahNumberText}>{ayahNumber}</Text>
        </View>
        <Pressable style={styles.ayahNoteButton} onPress={onAyahPress}>
          <MessageSquarePlus color={palette.ink} size={15} />
          <Text style={styles.ayahNoteButtonText}>Ayah note</Text>
        </Pressable>
      </View>

      <Text style={styles.arabicVerse}>{arabic}</Text>
      {transliteration ? <Text style={styles.transliterationText}>{transliteration}</Text> : null}
      <Text style={styles.translationText}>{translation}</Text>

      {tafsir ? (
        <View style={styles.tafsirContainer}>
          <Pressable style={styles.tafsirToggle} onPress={() => setTafsirExpanded((prev) => !prev)}>
            <Text style={styles.tafsirLabel}>Tafsir {tafsirExpanded ? '▲' : '▼'}</Text>
          </Pressable>
          {tafsirExpanded ? (
            <Pressable onPress={() => setTafsirExpanded(false)}>
              <Text style={styles.tafsirBody}>{tafsir}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.wordChipsRow}>
        {words.map((word, wordIndex) => {
          const hasNote = wordHasNotes.has(wordIndex);
          return (
            <Pressable
              key={`${word}-${wordIndex}`}
              style={[styles.wordChip, hasNote ? styles.wordChipActive : null]}
              onPress={() => onWordPress(wordIndex, word)}
            >
              <Type color={hasNote ? palette.forest : palette.smoke} size={12} />
              <Text style={[styles.wordChipText, hasNote ? styles.wordChipTextActive : null]}>{word}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

function ReflectionPanel({ selectedAyah, onPromptPress, onOpenComposer }: {
  selectedAyah: number;
  onPromptPress: (prompt: string) => void;
  onOpenComposer: () => void;
}) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Ayah {selectedAyah} — My Reflection</Text>
      <View style={styles.promptsRow}>
        {REFLECTION_PROMPTS.map((prompt, index) => (
          <Pressable key={prompt} style={styles.promptChip} onPress={() => onPromptPress(prompt)} testID={`prompt-chip-${index}`}>
            <Text style={styles.promptText}>{prompt}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={onOpenComposer}>
        <Text style={styles.buttonText}>Add Reflection Note</Text>
      </Pressable>
    </View>
  );
}

function NoteRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.noteRow}>{children}</View>;
}

export default function SurahScreen() {
  const { id, ayah } = useLocalSearchParams<{ id: string; ayah?: string }>();
  const surahNumber = Number(id || 1);
  const { translationId, showTransliteration, showTafsir, tafsirSlug } = useQuranSettingsStore();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [tafsirPickerVisible, setTafsirPickerVisible] = useState(false);

  const query = useQuery({
    queryKey: ['surah', surahNumber, translationId, showTransliteration],
    queryFn: () => fetchSurahDetail(surahNumber, translationId, showTransliteration),
  });

  const activeTranslationLabel = TRANSLATIONS.find((t) => t.id === translationId)?.label ?? 'Translation';

  const { data: tafsirTexts } = useQuery({
    queryKey: ['tafsir', surahNumber, tafsirSlug],
    queryFn: () => fetchSurahTafsir(tafsirSlug, surahNumber, query.data?.verses.length ?? 0),
    enabled: showTafsir && (query.data?.verses.length ?? 0) > 0,
    staleTime: Infinity,
  });

  const [selection, setSelection] = useState<Selection>({ type: 'surah' });
  const [composerVisible, setComposerVisible] = useState(false);
  const [composerInitialContent, setComposerInitialContent] = useState('');
  const [composerInitialTags, setComposerInitialTags] = useState<NoteTag[] | undefined>(undefined);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const { notes, notesForAyah, notesForSurah, addNote, updateNote, deleteNote } = useNotes();

  useEffect(() => {
    const selectedAyah = Number(ayah);
    if (Number.isFinite(selectedAyah) && selectedAyah > 0) {
      setSelection({ type: 'ayah', ayahNumber: selectedAyah });
    } else {
      setSelection({ type: 'surah' });
    }
  }, [ayah, surahNumber]);

  const chapterNotes = useMemo(() => notesForSurah(surahNumber), [notesForSurah, surahNumber]);
  const selectedNotes = useMemo(() => {
    if (selection.type === 'surah') {
      return chapterNotes;
    }

    if (selection.type === 'ayah') {
      return notesForAyah(surahNumber, selection.ayahNumber);
    }

    return notes.filter((note) => (
      note.referenceType === 'word'
      && note.surahNumber === surahNumber
      && note.ayahNumber === selection.ayahNumber
      && note.wordIndex === selection.wordIndex
    ));
  }, [chapterNotes, notes, notesForAyah, selection, surahNumber]);

  const wordNoteMap = useMemo(() => {
    const map = new Map<number, Set<number>>();
    notes.forEach((note) => {
      if (note.referenceType === 'word' && note.surahNumber === surahNumber && note.ayahNumber && typeof note.wordIndex === 'number') {
        const ayahSet = map.get(note.ayahNumber) ?? new Set<number>();
        ayahSet.add(note.wordIndex);
        map.set(note.ayahNumber, ayahSet);
      }
    });
    return map;
  }, [notes, surahNumber]);

  const listData = useMemo<SurahListItem[]>(() => {
    const verses = query.data?.verses ?? [];
    const versesWithTafsir = verses.map((verse, index) => ({
      ...verse,
      tafsir: showTafsir ? tafsirTexts?.[index] : undefined,
    }));

    const items: SurahListItem[] = [{ type: 'chapterNotes' }];
    versesWithTafsir.forEach((verse) => {
      items.push({ type: 'verse', verse });
    });
    items.push({ type: 'ayahNotes' });
    return items;
  }, [query.data?.verses, showTafsir, tafsirTexts]);

  const openComposer = () => {
    setEditingNoteId(null);
    setComposerInitialContent('');
    setComposerInitialTags(undefined);
    setComposerVisible(true);
  };

  const handlePromptPress = (prompt: string) => {
    const promptContent = `${prompt}\n\n`;
    setEditingNoteId(null);
    setComposerInitialTags(undefined);
    setComposerInitialContent((current) => (current ? `${current}\n\n${promptContent}` : promptContent));
    setComposerVisible(true);
  };

  const handleEditNote = (note: UserNote) => {
    setEditingNoteId(note.id);
    setComposerInitialContent(note.content);
    setComposerInitialTags(note.tags);
    setComposerVisible(true);
  };

  const handleSaveNote = (content: string, tags: string[]) => {
    if (editingNoteId) {
      void updateNote(editingNoteId, { content, tags: tags as NoteTag[] });
      setEditingNoteId(null);
    } else {
      const referencePayload = selection.type === 'surah'
        ? { referenceType: 'surah' as const, surahNumber }
        : selection.type === 'ayah'
          ? { referenceType: 'ayah' as const, surahNumber, ayahNumber: selection.ayahNumber }
          : {
            referenceType: 'word' as const,
            surahNumber,
            ayahNumber: selection.ayahNumber,
            wordIndex: selection.wordIndex,
          };

      void addNote({
        ...referencePayload,
        content,
        tags: tags as NoteTag[],
      });
    }

    setComposerInitialContent('');
    setComposerInitialTags(undefined);
    setComposerVisible(false);
  };

  return (
    <>
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={listData}
        keyExtractor={(item) => (item.type === 'verse' ? `verse-${item.verse.numberInSurah}` : item.type)}
        initialNumToRender={8}
        windowSize={7}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={30}
        removeClippedSubviews
        renderItem={({ item }) => {
          if (item.type === 'chapterNotes') {
            return (
              <>
                <View style={styles.surahHeader}>
                  <Text style={styles.heading}>{query.data?.englishName || 'Surah'}</Text>
                  <View style={styles.headerActions}>
                    <Pressable style={styles.translationButton} onPress={() => setPickerVisible(true)}>
                      <Languages color={palette.forest} size={15} />
                      <Text style={styles.translationButtonText}>{activeTranslationLabel}</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.translationButton, showTafsir ? styles.translationButtonActive : null]}
                      onPress={() => setTafsirPickerVisible(true)}
                    >
                      <BookOpen color={showTafsir ? palette.forest : palette.smoke} size={15} />
                      <Text style={[styles.translationButtonText, !showTafsir ? styles.translationButtonTextMuted : null]}>
                        Tafsir
                      </Text>
                    </Pressable>
                  </View>
                </View>
                <View style={styles.panel}>
                  <Text style={styles.title}>Chapter Notes</Text>
                  <Pressable
                    onPress={() => {
                      setSelection({ type: 'surah' });
                      openComposer();
                    }}
                  >
                    <Text style={styles.buttonText}>+ Add chapter note</Text>
                  </Pressable>
                  {chapterNotes.map((note) => (
                    <NoteRow key={note.id}>
                      <NoteCard note={note} onDelete={deleteNote} onEdit={handleEditNote} />
                    </NoteRow>
                  ))}
                </View>
              </>
            );
          }

          if (item.type === 'ayahNotes') {
            if (selection.type !== 'ayah') {
              return null;
            }

            return (
              <>
                <ReflectionPanel selectedAyah={selection.ayahNumber} onPromptPress={handlePromptPress} onOpenComposer={openComposer} />
                {selectedNotes.map((note) => (
                  <NoteRow key={note.id}>
                    <NoteCard note={note} onDelete={deleteNote} onEdit={handleEditNote} />
                  </NoteRow>
                ))}
              </>
            );
          }

          return (
            <AyahCard
              ayahNumber={item.verse.numberInSurah}
              arabic={item.verse.arabic}
              translation={item.verse.translation}
              transliteration={item.verse.transliteration}
              tafsir={item.verse.tafsir}
              onAyahPress={() => {
                setSelection({ type: 'ayah', ayahNumber: item.verse.numberInSurah });
                openComposer();
              }}
              onWordPress={(wordIndex, wordText) => {
                setSelection({ type: 'word', ayahNumber: item.verse.numberInSurah, wordIndex, wordText });
                openComposer();
              }}
              wordHasNotes={wordNoteMap.get(item.verse.numberInSurah) ?? new Set<number>()}
            />
          );
        }}
      />

      <TranslationPicker visible={pickerVisible} onClose={() => setPickerVisible(false)} />
      <TafsirPicker visible={tafsirPickerVisible} onClose={() => setTafsirPickerVisible(false)} />

      <NoteComposer
        visible={composerVisible}
        referenceType={selection.type}
        surahNumber={surahNumber}
        ayahNumber={selection.type === 'surah' ? undefined : selection.ayahNumber}
        wordIndex={selection.type === 'word' ? selection.wordIndex : undefined}
        wordText={selection.type === 'word' ? selection.wordText : undefined}
        surahName={query.data?.englishName || 'Surah'}
        initialContent={composerInitialContent}
        initialTags={composerInitialTags}
        onClose={() => setComposerVisible(false)}
        onSave={handleSaveNote}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  content: {
    padding: 16,
    gap: 10,
    paddingBottom: 32,
  },
  surahHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
  },
  translationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.mist,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  translationButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.forest,
  },
  translationButtonActive: {
    borderColor: palette.forest,
  },
  translationButtonTextMuted: {
    color: palette.smoke,
  },
  transliterationText: {
    fontSize: 13,
    color: palette.smoke,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  ayahCard: {
    backgroundColor: palette.white,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  ayahHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ayahNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ayahNumberText: {
    color: palette.white,
    fontWeight: '700',
    fontSize: 14,
  },
  ayahNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.sand,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  ayahNoteButtonText: {
    color: palette.ink,
    fontWeight: '600',
    fontSize: 13,
  },
  arabicVerse: {
    fontSize: 26,
    textAlign: 'right',
    color: palette.ink,
    lineHeight: 42,
  },
  translationText: {
    fontSize: 15,
    color: palette.smoke,
    lineHeight: 22,
  },
  tafsirContainer: {
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: 10,
    gap: 8,
  },
  tafsirToggle: {
    alignSelf: 'flex-start',
  },
  tafsirLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: palette.smoke,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  tafsirBody: {
    fontSize: 13,
    color: palette.smoke,
    lineHeight: 20,
    backgroundColor: palette.paper,
    padding: 10,
    borderRadius: 8,
  },
  wordChipsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: palette.sand,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  wordChipActive: {
    backgroundColor: palette.sand,
    borderColor: palette.forest,
  },
  wordChipText: {
    fontSize: 15,
    color: palette.smoke,
    fontWeight: '500',
  },
  wordChipTextActive: {
    color: palette.forest,
    fontWeight: '700',
  },
  panel: {
    backgroundColor: palette.mist,
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  title: {
    fontWeight: '700',
  },
  promptsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  promptChip: {
    borderRadius: 999,
    backgroundColor: palette.sand,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  promptText: {
    color: palette.forest,
    fontWeight: '600',
  },
  buttonText: {
    backgroundColor: palette.forest,
    color: palette.white,
    padding: 10,
    borderRadius: 8,
    overflow: 'hidden',
    textAlign: 'center',
  },
  noteRow: {
    borderRadius: 8,
  },
});
