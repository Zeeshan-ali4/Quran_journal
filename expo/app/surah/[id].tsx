import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, Pressable, View, TextInput } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchSurahDetail } from '@/data/api/quran';
import { useNotes } from '@/providers/notes-provider';
import { palette } from '@/constants/colors';

const TAGS = ['reflection', 'action', 'question', "du'a", 'theme'];
const prompts = ['What does this ayah teach me about Allah?','What action can I take from this ayah?','What guidance, warning, or comfort is here?','What question do I want to study further?'];

export default function SurahScreen(){
  const {id}=useLocalSearchParams<{id:string}>();
  const surahNumber=Number(id||1);
  const q=useQuery({queryKey:['surah',surahNumber], queryFn:()=>fetchSurahDetail(surahNumber)});
  const [selectedAyah,setSelectedAyah]=useState<number|null>(null);
  const {notesForAyah,addNote,deleteNote}=useNotes();
  const [content,setContent]=useState(''); const [tags,setTags]=useState<string[]>(['reflection']); const [showTafsir,setShowTafsir]=useState(true);
  const selectedNotes=selectedAyah?notesForAyah(surahNumber,selectedAyah):[];
  return <ScrollView style={styles.s} contentContainerStyle={styles.c}><Text style={styles.h}>{q.data?.englishName||'Surah'}</Text>{q.data?.verses.map(v=><Pressable key={v.numberInSurah} style={styles.a} onPress={()=>setSelectedAyah(v.numberInSurah)}><Text style={styles.ar}>{v.arabic}</Text><Text>{v.translation}</Text></Pressable>)}{selectedAyah&&<View style={styles.p}><Text style={styles.t}>Ayah {selectedAyah} — My Reflection</Text>{prompts.map(p=><Text key={p} style={styles.pr}>• {p}</Text>)}<TextInput value={content} onChangeText={setContent} placeholder='My Reflection' style={styles.i} multiline />
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{TAGS.map(t=><Pressable key={t} onPress={()=>setTags(tags.includes(t)?tags.filter(x=>x!==t):[...tags,t])}><Text style={{padding:6,backgroundColor:tags.includes(t)?'#dcead8':'#eee',borderRadius:8}}>{t}</Text></Pressable>)}</View>
  <Pressable onPress={()=>{if(!content.trim())return;addNote({referenceType:'ayah',surahNumber,ayahNumber:selectedAyah,content,tags});setContent('');}}><Text style={styles.btn}>Save Reflection</Text></Pressable>
  <Pressable onPress={()=>setShowTafsir(!showTafsir)}><Text style={styles.link}>{showTafsir?'Hide':'Show'} Scholarly Tafsir</Text></Pressable>
  {showTafsir?<View style={styles.taf}><Text style={styles.label}>Scholarly Tafsir (Read-only)</Text><Text>This is a placeholder tafsir panel. Tafsir is non-editable by design.</Text></View>:null}
  {selectedNotes.map(n=><View key={n.id} style={styles.note}><Text>{n.content}</Text><Pressable onPress={()=>deleteNote(n.id)}><Text>Delete</Text></Pressable></View>)}
</View>}</ScrollView>
}
const styles=StyleSheet.create({s:{flex:1,backgroundColor:palette.paper},c:{padding:16,gap:10},h:{fontSize:24,fontWeight:'700'},a:{backgroundColor:'#fff',padding:12,borderRadius:10,gap:8},ar:{fontSize:22,textAlign:'right'},p:{backgroundColor:'#fff7eb',padding:12,borderRadius:12,gap:10},t:{fontWeight:'700'},pr:{color:palette.smoke},i:{backgroundColor:'#fff',minHeight:100,borderRadius:8,padding:8},btn:{backgroundColor:palette.forest,color:'#fff',padding:10,borderRadius:8,overflow:'hidden',textAlign:'center'},link:{color:palette.forest,fontWeight:'700'},taf:{backgroundColor:'#f1f1f1',padding:10,borderRadius:8},label:{fontWeight:'700'},note:{backgroundColor:'#fff',padding:8,borderRadius:8}})
