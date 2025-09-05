// app/(tabs)/greetings.tsx
import React, { useRef, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { audioMap } from "../../src/assets/audioMap";

type Phrase = { id: string; pt: string; en: string; audioKey?: string };

const DATA: Phrase[] = [
  { id: "1", pt: "Olá", en: "Hello", audioKey: "hello_en" },
  { id: "2", pt: "Oi", en: "Hi", audioKey: "hi_en" },
  { id: "3", pt: "Bom dia", en: "Good morning", audioKey: "good_morning_en" },
  { id: "4", pt: "Boa tarde", en: "Good afternoon", audioKey: "good_afternoon_en" },
  { id: "5", pt: "Boa noite", en: "Good evening", audioKey: "good_evening_en" },
  { id: "6", pt: "Boa noite (despedida)", en: "Good night", audioKey: "good_night_en" },
  { id: "7", pt: "Obrigado(a)", en: "Thank you", audioKey: "thank_you_en" },
  { id: "8", pt: "Com licença", en: "Excuse me", audioKey: "excuse_me_en" },
  { id: "9", pt: "Até logo", en: "See you later", audioKey: "see_you_later_en" }
];

export default function Greetings() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const stopAll = async () => {
    try { Speech.stop(); } catch {}
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
    setPlayingId(null);
  };

  // Wrapper síncrono para usar nas props do Speech.speak
  const handleStop = () => {
    // não retornar a Promise evita o erro de tipo
    stopAll().catch(() => {});
  };

  const playItem = async (item: Phrase) => {
    await stopAll();

    // 1) tenta arquivo local
    const src = item.audioKey ? audioMap[item.audioKey] : undefined;
    if (src) {
      try {
        const { sound } = await Audio.Sound.createAsync(src, { shouldPlay: true });
        soundRef.current = sound;
        setPlayingId(item.id);
        sound.setOnPlaybackStatusUpdate((st: any) => {
          if (st?.didJustFinish) { handleStop(); }
        });
        return;
      } catch {
        // falhou o arquivo -> cai para TTS
      }
    }

    // 2) fallback: TTS
    try {
      setPlayingId(item.id);
      Speech.speak(item.en, {
        language: "en-US",
        rate: 0.98,
        onDone: handleStop,
        onStopped: handleStop,
        onError: () => {
          handleStop();
          Alert.alert("Áudio indisponível", "Adicione os arquivos de áudio quando tiver.");
        }
      });
    } catch {
      handleStop();
      Alert.alert("Áudio indisponível", "Adicione os arquivos de áudio quando tiver.");
    }
  };

  const renderItem = ({ item }: { item: Phrase }) => {
    const isPlaying = playingId === item.id;
    return (
      <View style={s.card}>
        <View style={{ flex: 1 }}>
          <Text style={s.pt}>{item.pt}</Text>
          <Text style={s.en}>{item.en}</Text>
        </View>
        <TouchableOpacity style={[s.playBtn, isPlaying && s.playBtnActive]} onPress={() => playItem(item)}>
          <Text style={[s.playIcon, isPlaying && s.playIconActive]}>{isPlaying ? "⏸" : "▶︎"}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Saudações</Text>
      <Text style={s.subtitle}>Frases úteis para o dia a dia</Text>

      <FlatList
        data={DATA}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

const COLOR = {
  text: "#111827",
  muted: "#6b7280",
  card: "#f6f7f8",
  border: "#e5e7eb",
  primary: "#2e7d32"
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "800", color: COLOR.text, marginTop: 30, marginHorizontal: 16 },
  subtitle: { fontSize: 14, color: COLOR.muted, marginHorizontal: 16, marginBottom: 8 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLOR.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLOR.border,
    marginHorizontal: 16
  },
  pt: { fontSize: 18, fontWeight: "800", color: COLOR.text },
  en: { fontSize: 14, color: COLOR.muted, marginTop: 4 },

  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: COLOR.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginLeft: 12
  },
  playBtnActive: { borderColor: COLOR.primary, backgroundColor: "#eaf4eb" },
  playIcon: { fontSize: 18, color: COLOR.muted, fontWeight: "900" },
  playIconActive: { color: COLOR.primary }
});
