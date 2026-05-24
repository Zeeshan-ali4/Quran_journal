import React, { useMemo } from 'react';
import { router } from 'expo-router';
import { Bookmark, ChevronRight, Trash2 } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/colors';
import { useBookmarkStore } from '@/stores/bookmark-store';

export default function BookmarksScreen() {
  const bookmarks = useBookmarkStore((state) => state.bookmarks);
  const removeBookmark = useBookmarkStore((state) => state.removeBookmark);

  const sortedBookmarks = useMemo(
    () => [...bookmarks].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()),
    [bookmarks]
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Bookmarks</Text>

      {sortedBookmarks.length === 0 ? (
        <Text style={styles.emptyText}>No bookmarks yet. Tap the bookmark icon on any verse to save it.</Text>
      ) : (
        sortedBookmarks.map((bookmark) => (
          <Pressable
            key={`${bookmark.surahNumber}-${bookmark.ayahNumber}`}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: '/surah/[id]',
                params: { id: String(bookmark.surahNumber), ayah: String(bookmark.ayahNumber) },
              })
            }
          >
            <View style={styles.row}>
              <View style={styles.leftRow}>
                <Bookmark color={palette.gold} fill={palette.gold} size={18} />
                <View style={styles.textWrap}>
                  <Text style={styles.titleText}>{bookmark.surahName || `Surah ${bookmark.surahNumber}`}</Text>
                  <Text style={styles.metaText}>· Ayah {bookmark.ayahNumber}</Text>
                </View>
              </View>
              <ChevronRight color={palette.smoke} size={18} />
            </View>

            <View style={styles.row}>
              <Text style={styles.metaText}>{new Date(bookmark.savedAt).toLocaleDateString()}</Text>
              <Pressable onPress={() => removeBookmark(bookmark.surahNumber, bookmark.ayahNumber)} hitSlop={8}>
                <Trash2 size={16} color={palette.smoke} />
              </Pressable>
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 12,
    padding: 16,
    backgroundColor: palette.paper,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
  },
  emptyText: {
    color: palette.smoke,
  },
  card: {
    backgroundColor: palette.white,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  textWrap: {
    gap: 2,
    flexShrink: 1,
  },
  titleText: {
    fontWeight: '700',
    color: palette.ink,
  },
  metaText: {
    color: palette.smoke,
    fontSize: 12,
  },
});
