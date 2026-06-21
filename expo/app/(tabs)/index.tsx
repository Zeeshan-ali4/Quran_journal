import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useIsFetching, useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Search, Sparkles } from 'lucide-react-native';

import { SurahListItem } from '@/components/surah-list-item';
import { palette } from '@/constants/colors';
import { fetchSurahList } from '@/data/api/quran';
import { useBookmarkStore } from '@/stores/bookmark-store';
import type { SurahSummary } from '@/types/quran';

interface SurahRowProps {
  surah: SurahSummary;
  hasBookmark: boolean;
  onPress: () => void;
}

function SurahRow({ surah, hasBookmark, onPress }: SurahRowProps) {
  const isDownloading =
    useIsFetching({
      predicate: (query) => query.queryKey[0] !== 'surahs' && query.queryKey[1] === surah.number,
    }) > 0;

  return <SurahListItem surah={surah} hasBookmark={hasBookmark} isDownloading={isDownloading} onPress={onPress} />;
}

export default function ReadScreen() {
  const router = useRouter();
  const [search, setSearch] = useState<string>('');

  const surahsQuery = useQuery<SurahSummary[]>({
    queryKey: ['surahs'],
    queryFn: fetchSurahList,
  });

  const bookmarks = useBookmarkStore((state) => state.bookmarks);

  const filteredSurahs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return surahsQuery.data ?? [];
    }

    return (surahsQuery.data ?? []).filter((surah) => {
      return (
        surah.englishName.toLowerCase().includes(query) ||
        surah.englishNameTranslation.toLowerCase().includes(query) ||
        surah.name.includes(search)
      );
    });
  }, [search, surahsQuery.data]);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={surahsQuery.isRefetching} onRefresh={surahsQuery.refetch} />
        }
        testID="read-screen"
      >
        <LinearGradient colors={[palette.forest, '#314D3B', palette.olive]} style={styles.hero}>
          <Text style={styles.eyebrow}>Qur&apos;an notes</Text>
          <Text style={styles.heroTitle}>Read with presence. Capture reflections verse by verse.</Text>
          <Text style={styles.heroBody}>
            Browse every surah, open a clean Arabic + English reading view, and pin notes to a
            chapter, ayah, or individual word.
          </Text>
          <View style={styles.heroPillRow}>
            <View style={styles.heroPill}>
              <Sparkles color={palette.amber} size={14} />
              <Text style={styles.heroPillText}>Word notes</Text>
            </View>
            <View style={styles.heroPill}>
              <Sparkles color={palette.amber} size={14} />
              <Text style={styles.heroPillText}>Verse reflections</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.searchShell}>
          <Search color={palette.smoke} size={18} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search surah name or meaning"
            placeholderTextColor={palette.smoke}
            style={styles.searchInput}
            testID="surah-search-input"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Surah library</Text>
          <Text style={styles.sectionMeta}>{filteredSurahs.length} chapters</Text>
        </View>

        {surahsQuery.isPending ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={palette.forest} />
            <Text style={styles.stateTitle}>Loading chapters…</Text>
          </View>
        ) : null}

        {surahsQuery.isError ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Unable to load the Qur&apos;an list right now.</Text>
            <Text style={styles.stateBody}>Pull to refresh and try again.</Text>
          </View>
        ) : null}

        {!surahsQuery.isPending && !surahsQuery.isError
          ? filteredSurahs.map((surah) => (
              <SurahRow
                key={surah.number}
                surah={surah}
                hasBookmark={bookmarks.some((bookmark) => bookmark.surahNumber === surah.number)}
                onPress={() => router.push(`/surah/${surah.number}`)}
              />
            ))
          : null}

        {!surahsQuery.isPending && !surahsQuery.isError && filteredSurahs.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>No matching chapters</Text>
            <Text style={styles.stateBody}>Try another spelling or search by translation.</Text>
          </View>
        ) : null}

        <Pressable style={styles.footerCard} testID="reading-tips-card">
          <Text style={styles.footerEyebrow}>A focused first version</Text>
          <Text style={styles.footerTitle}>Designed for study circles, journaling, and memorization.</Text>
          <Text style={styles.footerBody}>
            Tap a chapter to open the reader. Inside, tap any word or ayah to attach a note.
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  content: {
    padding: 18,
    paddingTop: 22,
    paddingBottom: 36,
    gap: 16,
  },
  hero: {
    borderRadius: 30,
    padding: 22,
    gap: 12,
  },
  eyebrow: {
    color: '#D9C8A4',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  heroTitle: {
    color: palette.white,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
  },
  heroBody: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 15,
    lineHeight: 23,
  },
  heroPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroPillText: {
    color: palette.white,
    fontWeight: '600',
    fontSize: 13,
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 22,
    backgroundColor: palette.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: palette.ink,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 21,
    fontWeight: '700',
  },
  sectionMeta: {
    color: palette.smoke,
    fontSize: 13,
    fontWeight: '600',
  },

  stateCard: {
    borderRadius: 24,
    backgroundColor: palette.white,
    padding: 22,
    gap: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  stateTitle: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  stateBody: {
    color: palette.smoke,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  footerCard: {
    marginTop: 6,
    borderRadius: 28,
    backgroundColor: '#EFE5D4',
    padding: 20,
    gap: 10,
  },
  footerEyebrow: {
    color: palette.rose,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  footerTitle: {
    color: palette.ink,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  footerBody: {
    color: palette.smoke,
    fontSize: 14,
    lineHeight: 22,
  },
});
