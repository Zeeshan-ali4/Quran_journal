import { Audio, type AVPlaybackStatus } from 'expo-av';
import { Pause, Play, SkipBack, SkipForward, Square } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette } from '@/constants/colors';
import { getAudioUrl } from '@/data/api/audio';
import surahList from '@/data/surah-list.json';
import { useAudioStore } from '@/stores/audio-store';

export function AudioPlayer() {
  const insets = useSafeAreaInsets();
  const soundRef = useRef<Audio.Sound | null>(null);
  const failTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { reciterId, isPlaying, currentSurah, currentAyah, pause, resume, stop, prevAyah, nextAyah } = useAudioStore();

  const totalAyahs = useMemo(() => {
    if (!currentSurah) {
      return 0;
    }

    return surahList[currentSurah - 1]?.numberOfAyahs ?? 0;
  }, [currentSurah]);

  const clearFailTimer = () => {
    if (failTimerRef.current) {
      clearTimeout(failTimerRef.current);
      failTimerRef.current = null;
    }
  };

  const unloadCurrent = async () => {
    clearFailTimer();
    if (soundRef.current) {
      const sound = soundRef.current;
      soundRef.current = null;
      await sound.unloadAsync();
    }
  };

  useEffect(() => {
    void Audio.setAudioModeAsync({
      staysActiveInBackground: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
  }, []);

  useEffect(() => {
    const loadAndPlay = async () => {
      if (!currentSurah || !currentAyah || !isPlaying || !totalAyahs) {
        return;
      }

      try {
        await unloadCurrent();
        const url = getAudioUrl(currentSurah, currentAyah, reciterId);
        const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
        sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (!status.isLoaded) {
            return;
          }

          if (status.didJustFinish) {
            nextAyah(totalAyahs);
          }
        });
        soundRef.current = sound;
      } catch {
        clearFailTimer();
        failTimerRef.current = setTimeout(() => {
          nextAyah(totalAyahs);
        }, 700);
      }
    };

    void loadAndPlay();
  }, [currentAyah, currentSurah, isPlaying, nextAyah, reciterId, totalAyahs]);

  useEffect(() => {
    const togglePlayback = async () => {
      if (!soundRef.current) {
        return;
      }

      if (isPlaying) {
        await soundRef.current.playAsync();
      } else {
        await soundRef.current.pauseAsync();
      }
    };

    void togglePlayback();
  }, [isPlaying]);

  useEffect(() => () => {
    void unloadCurrent();
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
