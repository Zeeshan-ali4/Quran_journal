import { Audio } from 'expo-av';
import { Pause, Play, SkipBack, SkipForward, Square } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette } from '@/constants/colors';
import { cleanupAudioCache } from '@/data/api/audio-cache';
import { audioDownloadQueue } from '@/data/api/audio-download-queue';
import { audioPlaybackQueue } from '@/data/api/audio-playback-queue';
import surahList from '@/data/surah-list.json';
import { useAudioStore } from '@/stores/audio-store';

export function AudioPlayer() {
  const insets = useSafeAreaInsets();
  const lastTrackKeyRef = useRef<string | null>(null);
  const { reciterId, isPlaying, currentSurah, currentAyah, pause, resume, stop, prevAyah, nextAyah } = useAudioStore();

  const totalAyahs = useMemo(() => {
    if (!currentSurah) {
      return 0;
    }

    return surahList[currentSurah - 1]?.numberOfAyahs ?? 0;
  }, [currentSurah]);

  useEffect(() => {
    audioPlaybackQueue.setOptions({
      onFinish: () => nextAyah(totalAyahs),
      onFatalError: (error) => {
        console.warn('Audio playback failed after retries', error);
        pause();
      },
    });
  }, [nextAyah, pause, totalAyahs]);

  useEffect(() => {
    void Audio.setAudioModeAsync({
      staysActiveInBackground: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
    void cleanupAudioCache();
  }, []);

  useEffect(() => {
    if (!currentSurah || !currentAyah || !totalAyahs) {
      lastTrackKeyRef.current = null;
      void audioPlaybackQueue.clear();
      return;
    }

    const trackKey = `${reciterId}:${currentSurah}:${currentAyah}`;
    if (lastTrackKeyRef.current === trackKey) {
      return;
    }
    lastTrackKeyRef.current = trackKey;

    void audioPlaybackQueue.load({ reciterId, surah: currentSurah, ayah: currentAyah, totalAyahs }, isPlaying);
  }, [currentAyah, currentSurah, isPlaying, reciterId, totalAyahs]);

  useEffect(() => {
    void audioPlaybackQueue.setPlaying(isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    if (!currentSurah || !currentAyah || !totalAyahs) {
      return;
    }

    audioDownloadQueue.prioritize({ reciterId, surah: currentSurah, ayah: currentAyah, totalAyahs });
  }, [currentAyah, currentSurah, reciterId, totalAyahs]);

  useEffect(() => () => {
    void audioPlaybackQueue.clear();
  }, []);

  if (!currentSurah || !currentAyah) {
    return null;
  }

  const surahName = surahList[currentSurah - 1]?.englishName ?? `Surah ${currentSurah}`;

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) + 58 }]}>
      <View style={styles.playerBar}>
        <View style={styles.leftBlock}>
          <Text style={styles.surahName}>{surahName}</Text>
          <Text style={styles.ayahLabel}>Ayah {currentAyah}</Text>
        </View>

        <View style={styles.controls}>
          <Pressable style={styles.iconButton} onPress={() => prevAyah()}>
            <SkipBack color={palette.white} size={18} />
          </Pressable>
          <Pressable
            style={[styles.iconButton, styles.primaryButton]}
            onPress={() => {
              if (isPlaying) {
                pause();
              } else {
                resume();
              }
            }}
          >
            {isPlaying ? <Pause color={palette.forest} size={18} /> : <Play color={palette.forest} size={18} />}
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => nextAyah(totalAyahs)}>
            <SkipForward color={palette.white} size={18} />
          </Pressable>
        </View>

        <Pressable style={styles.iconButton} onPress={() => stop()}>
          <Square color={palette.gold} size={16} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
  },
  playerBar: {
    backgroundColor: palette.forest,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftBlock: {
    flex: 1,
  },
  surahName: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '700',
  },
  ayahLabel: {
    color: palette.gold,
    fontSize: 12,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: palette.gold,
  },
});
