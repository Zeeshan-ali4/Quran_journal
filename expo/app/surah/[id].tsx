import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, BookmarkPlus, MessageSquarePlus, Sparkles, Type, Users } from 'lucide-react-native';

import { NoteCard } from '@/components/note-card';
import { NoteComposer } from '@/components/note-composer';
import { palette } from '@/constants/colors';
import { fetchSurahDetail } from '@/data/api/quran';
import { useFollowerNotesForTarget, useNotes, useNotesForTarget } from '@/providers/notes-provider';
import type { NoteTarget, SurahDetail, Verse } from '@/types/quran';

const bismillah = 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ';

function splitWords(text: string) {
  return text
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

export default function SurahDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const [composerTarget, setComposerTarget] = useState<NoteTarget | null>(null);
  const [composerVisible, setComposerVisible] = useState<boolean>(false);
  const surahNumber = Number(params.id ?? '1');
  const { addNote, socialPreferences } = useNotes();

  const surahQuery = useQuery<SurahDetail>({
    queryKey: ['surah', surahNumber],
    queryFn: () => fetchSurahDetail(surahNumber),
    enabled: Number.isFinite(surahNumber),
  });

  const chapterTarget = useMemo<NoteTarget | null>(() => {
    if (!surahQuery.data) {
      return null;
    }

    return {
      type: 'chapter',
      surahNumber: surahQuery.data.number,
      surahName: surahQuery.data.englishName,
    };
  }, [surahQuery.data]);

  const chapterNotes = useNotesForTarget(
    chapterTarget ?? {
      type: 'chapter',
      surahNumber,
      surahName: '',
    }
  );
  const chapterFollowerNotes = useFollowerNotesForTarget(
    chapterTarget ?? {
      type: 'chapter',
      surahNumber,
      surahName: '',
    }
  );

  const openComposer = (target: NoteTarget) => {
    console.log('[Surah] Opening composer', target);
    setComposerTarget(target);
    setComposerVisible(true);
  };

  const closeComposer = () => {
    setComposerVisible(false);
    setComposerTarget(null);
  };

  const handleSaveNote = (content: string, shouldShare: boolean) => {
    if (!composerTarget) {
      return;
    }

    addNote(composerTarget, content, shouldShare);
    closeComposer();
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={[palette.forest, '#2E4A38', '#566649']} style={styles.headerBackdrop}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.iconButton} testID="back-button">
              <ArrowLeft color={palette.white} size={20} />
            </Pressable>
            <Text style={styles.topBarTitle}>Surah</Text>
            <View style={styles.iconButtonPlaceholder} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.bodyScroll}
        contentContainerStyle={styles.bodyContent}
        refreshControl={
          <RefreshControl refreshing={surahQuery.isRefetching} onRefresh={surahQuery.refetch} />
        }
        testID="surah-detail-screen"
      >
        {surahQuery.isLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={palette.forest} />
            <Text style={styles.loadingText}>Loading surah...</Text>
          </View>
        ) : null}

        {surahQuery.isError ? (
          <View style={styles.loadingCard}>
            <Text style={styles.errorTitle}>Unable to load this surah.</Text>
            <Text style={styles.errorBody}>Pull to refresh and try again.</Text>
          </View>
        ) : null}

        {surahQuery.data ? (
          <>
            <LinearGradient colors={['#FFF8EC', '#F2E4C9']} style={styles.heroCard}>
              <Text style={styles.heroArabic}>{surahQuery.data.name}</Text>
              <Text style={styles.heroTitle}>{surahQuery.data.englishName}</Text>
              <Text style={styles.heroSubtitle}>{surahQuery.data.englishNameTranslation}</Text>
              <View style={styles.heroMetaRow}>
                <Text style={styles.heroMeta}>{surahQuery.data.revelationType}</Text>
                <View style={styles.heroDot} />
                <Text style={styles.heroMeta}>{surahQuery.data.numberOfAyahs} ayahs</Text>
              </View>
              <Pressable
                onPress={() => chapterTarget && openComposer(chapterTarget)}
                style={styles.chapterNoteButton}
                testID="chapter-note-button"
              >
                <BookmarkPlus color={palette.white} size={16} />
                <Text style={styles.chapterNoteButtonText}>Chapter note</Text>
              </Pressable>
            </LinearGradient>

            <View style={styles.feedHintCard}>
              <View style={styles.feedHintIcon}>
                <Users color={palette.forest} size={16} />
              </View>
              <View style={styles.feedHintTextWrap}>
                <Text style={styles.feedHintTitle}>Follower insights</Text>
                <Text style={styles.feedHintBody}>
                  {socialPreferences.showFollowerNotes
                    ? 'Shared notes from people you follow appear below each matching chapter or ayah.'
                    : 'Follower notes are hidden right now. Turn them on again from the Notes tab.'}
                </Text>
              </View>
            </View>

            <View style={styles.bismillahCard}>
              <Text style={styles.bismillahText}>{bismillah}</Text>
            </View>

            {chapterFollowerNotes.length > 0 ? (
              <View style={styles.notesSection}>
                <View style={styles.sectionHeadingRow}>
                  <Sparkles color={palette.gold} size={16} />
                  <Text style={styles.notesSectionTitle}>From people you follow</Text>
                </View>
                {chapterFollowerNotes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </View>
            ) : null}

            {chapterNotes.length > 0 ? (
              <View style={styles.notesSection}>
                <Text style={styles.notesSectionTitle}>Chapter reflections</Text>
                {chapterNotes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </View>
            ) : null}

            {surahQuery.data.verses.map((verse) => (
              <VerseCard key={verse.numberInSurah} surah={surahQuery.data} verse={verse} onOpenComposer={openComposer} />
            ))}
          </>
        ) : null}
      </ScrollView>

      <NoteComposer
        visible={composerVisible}
        target={composerTarget}
        defaultShareEnabled={socialPreferences.shareNotesToFollowers}
        onClose={closeComposer}
        onSave={handleSaveNote}
      />
    </View>
  );
}

function VerseCard({
  surah,
  verse,
  onOpenComposer,
}: {
  surah: SurahDetail;
  verse: Verse;
  onOpenComposer: (target: NoteTarget) => void;
}) {
  const verseTarget = useMemo<NoteTarget>(
    () => ({
      type: 'verse',
      surahNumber: surah.number,
      surahName: surah.englishName,
      verseNumber: verse.numberInSurah,
    }),
    [surah.englishName, surah.number, verse.numberInSurah]
  );

  const verseNotes = useNotesForTarget(verseTarget);
  const followerVerseNotes = useFollowerNotesForTarget(verseTarget);
  const words = useMemo(() => splitWords(verse.arabic), [verse.arabic]);

  return (
    <View style={styles.verseCard} testID={`verse-card-${verse.numberInSurah}`}>
      <View style={styles.verseHeader}>
        <View style={styles.verseBadge}>
          <Text style={styles.verseBadgeText}>{verse.numberInSurah}</Text>
        </View>
        <View style={styles.verseActions}>
          <Pressable
            onPress={() => onOpenComposer(verseTarget)}
            style={styles.verseActionButton}
            testID={`verse-note-button-${verse.numberInSurah}`}
          >
            <MessageSquarePlus color={palette.forest} size={16} />
            <Text style={styles.verseActionText}>Ayah note</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.arabicText}>{verse.arabic}</Text>
      <Text style={styles.translationText}>{verse.translation}</Text>

      <View style={styles.wordsWrap}>
        {words.map((word, index) => {
          const wordTarget: NoteTarget = {
            type: 'word',
            surahNumber: surah.number,
            surahName: surah.englishName,
            verseNumber: verse.numberInSurah,
            word,
          };

          return (
            <Pressable
              key={`${verse.numberInSurah}-${word}-${index}`}
              onPress={() => onOpenComposer(wordTarget)}
              style={styles.wordChip}
              testID={`word-chip-${verse.numberInSurah}-${index}`}
            >
              <Type color={palette.olive} size={14} />
              <Text style={styles.wordChipText}>{word}</Text>
            </Pressable>
          );
        })}
      </View>

      {followerVerseNotes.length > 0 ? (
        <View style={styles.inlineNotes}>
          <View style={styles.sectionHeadingRow}>
            <Users color={palette.forest} size={15} />
            <Text style={styles.inlineNotesTitle}>Follower notes</Text>
          </View>
          {followerVerseNotes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </View>
      ) : null}

      {verseNotes.length > 0 ? (
        <View style={styles.inlineNotes}>
          <Text style={styles.inlineNotesTitle}>Your notes</Text>
          {verseNotes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  headerBackdrop: {
    paddingBottom: 10,
  },
  safeArea: {
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPlaceholder: {
    width: 42,
    height: 42,
  },
  topBarTitle: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '700',
  },
  bodyScroll: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 42,
    gap: 16,
  },
  loadingCard: {
    marginTop: 24,
    borderRadius: 26,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  errorTitle: {
    color: palette.ink,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorBody: {
    color: palette.smoke,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  heroCard: {
    borderRadius: 32,
    padding: 22,
    gap: 8,
  },
  heroArabic: {
    color: palette.forest,
    fontSize: 32,
    textAlign: 'center',
    fontWeight: '700',
  },
  heroTitle: {
    color: palette.ink,
    fontSize: 30,
    textAlign: 'center',
    fontWeight: '800',
  },
  heroSubtitle: {
    color: palette.smoke,
    fontSize: 15,
    textAlign: 'center',
  },
  heroMetaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  heroMeta: {
    color: palette.olive,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  heroDot: {
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: palette.gold,
  },
  chapterNoteButton: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 18,
    backgroundColor: palette.forest,
    paddingVertical: 14,
  },
  chapterNoteButtonText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '700',
  },
  feedHintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 24,
    padding: 16,
    backgroundColor: '#FBF6EC',
    borderWidth: 1,
    borderColor: palette.border,
  },
  feedHintIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#E9DCC4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedHintTextWrap: {
    flex: 1,
    gap: 4,
  },
  feedHintTitle: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  feedHintBody: {
    color: palette.smoke,
    fontSize: 13,
    lineHeight: 19,
  },
  bismillahCard: {
    borderRadius: 26,
    backgroundColor: '#EFE6D6',
    padding: 22,
  },
  bismillahText: {
    color: palette.forest,
    fontSize: 28,
    lineHeight: 44,
    textAlign: 'center',
    fontWeight: '700',
  },
  notesSection: {
    gap: 10,
  },
  notesSectionTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verseCard: {
    borderRadius: 28,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 18,
    gap: 16,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  verseBadge: {
    width: 40,
    height: 40,
    borderRadius: 15,
    backgroundColor: palette.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseBadgeText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '700',
  },
  verseActions: {
    flexDirection: 'row',
  },
  verseActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    backgroundColor: '#EEF2EC',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  verseActionText: {
    color: palette.forest,
    fontSize: 13,
    fontWeight: '700',
  },
  arabicText: {
    color: palette.ink,
    fontSize: 28,
    lineHeight: 52,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontWeight: '600',
  },
  translationText: {
    color: '#534B43',
    fontSize: 16,
    lineHeight: 27,
  },
  wordsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    direction: 'rtl',
    justifyContent: 'flex-start',
  },
  wordChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5EEDF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  wordChipText: {
    color: palette.olive,
    fontSize: 14,
    fontWeight: '600',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  inlineNotes: {
    gap: 10,
  },
  inlineNotesTitle: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '700',
  },
});