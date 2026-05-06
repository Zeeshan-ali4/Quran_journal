import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNotes } from '@/providers/notes-provider';
import { palette } from '@/constants/colors';

export default function NotesScreen() {
  const { searchNotes, isLoading } = useNotes();
  const [query, setQuery] = useState('');
  const results = searchNotes(query);

  return <ScrollView contentContainerStyle={styles.c}><Text style={styles.h}>My Reflection Notes</Text><TextInput style={styles.i} placeholder='Search notes offline' value={query} onChangeText={setQuery} />{isLoading ? <Text>Loading notes…</Text> : null}{results.length===0?<Text style={styles.e}>No notes yet. Open a surah and tap an ayah to reflect.</Text>:results.map(n=><View key={n.id} style={styles.card}><Text style={styles.meta}>Surah {n.surahNumber} Ayah {n.ayahNumber}</Text><Text>{n.content}</Text><Text style={styles.meta}>{n.tags.join(', ') || 'untagged'}</Text></View>)}</ScrollView>;
}
const styles=StyleSheet.create({c:{padding:16,gap:12,backgroundColor:palette.paper,flexGrow:1},h:{fontSize:24,fontWeight:'700'},i:{backgroundColor:'#fff',borderRadius:12,padding:12},card:{backgroundColor:'#fff',padding:12,borderRadius:12,gap:6},meta:{color:palette.smoke,fontSize:12},e:{color:palette.smoke}})
