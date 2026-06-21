import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bookmark, ChevronRight } from 'lucide-react-native';

import { palette } from '@/constants/colors';
import type { SurahSummary } from '@/types/quran';

interface SurahListItemProps {
  surah: SurahSummary;
  onPress: () => void;
  hasBookmark?: boolean;
}

export function SurahListItem({ surah, onPress, hasBookmark = false }: SurahListItemProps) {
  return (
    <Pressable onPress={onPress} style={styles.card} testID={`surah-card-${surah.number}`}>
      <View style={styles.numberBadge}>
        <Text style={styles.numberText}>{surah.number}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{surah.englishName}</Text>
        <Text style={styles.translation}>{surah.englishNameTranslation}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{surah.revelationType}</Text>
          <View style={styles.dot} />
          <Text style={styles.meta}>{surah.numberOfAyahs} ayahs</Text>
        </View>
      </View>
      <View style={styles.rightColumn}>
        <Text style={styles.arabic}>{surah.name}</Text>
        <View style={styles.trailingIcons}>
          {hasBookmark ? <Bookmark color={palette.gold} size={12} fill={palette.gold} /> : null}
          <ChevronRight color={palette.smoke} size={18} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.cream,
    borderRadius: 24,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  numberBadge: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: palette.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    color: palette.white,
    fontWeight: '700',
    fontSize: 16,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  translation: {
    color: palette.smoke,
    fontSize: 13,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  meta: {
    color: palette.olive,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: palette.gold,
  },
  rightColumn: {
    alignItems: 'flex-end',
    gap: 10,
  },
  trailingIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arabic: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: '700',
  },
});
