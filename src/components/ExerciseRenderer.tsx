// src/components/ExerciseRenderer.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import { Audio } from "expo-av";
import type { Exercise } from "../store/useLessonStore";
import { audioMap } from "../assets/audioMap";

type Props = {
  exercise: Exercise;
  accentColor?: string;
  onSubmit: (payload: { optionId?: string; text?: string }) => void | Promise<void>;
  onSkip?: () => void;
  feedback?: { correct: boolean; message?: string };
};

export default function ExerciseRenderer({
  exercise,
  onSubmit,
  onSkip,
  feedback,
  accentColor = "#2e7d32"
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Fonte de áudio: chave local ou URL remota
  const audioSource = useMemo(() => {
    if ((exercise as any).audioKey && audioMap[(exercise as any).audioKey]) {
      return audioMap[(exercise as any).audioKey];
    }
    if ((exercise as any).audioUri) {
      return { uri: (exercise as any).audioUri as string };
    }
    return null;
  }, [exercise]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!audioSource) return;
      try {
        const { sound } = await Audio.Sound.createAsync(audioSource, {
          shouldPlay: false,
          progressUpdateIntervalMillis: 250
        });
        if (!mounted) {
          sound.unloadAsync().catch(() => {});
          return;
        }
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((st: any) => {
          if (!st || !st.isLoaded) return;
          setIsPlaying(st.isPlaying);
          setPosition(st.positionMillis ?? 0);
          setDuration(st.durationMillis ?? 0);
        });
      } catch {
        // ignore
      }
    };

    load();

    return () => {
      mounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
    };
  }, [audioSource, exercise?.id]);

  const togglePlay = async () => {
    const s = soundRef.current;
    if (!s) return;
    const ended = duration > 0 && position >= duration - 50;
    try {
      if (isPlaying) {
        await s.pauseAsync();
      } else {
        if (ended) {
          await s.setPositionAsync(0);
        }
        await s.playAsync();
      }
    } catch {
      // ignore
    }
  };

  const canConfirm = useMemo(() => {
    if (exercise.type === "select") return !!selected;
    return (text ?? "").trim().length > 0;
  }, [selected, text, exercise.type]);

  const handleConfirm = () => {
    if (!canConfirm) return;
    if (exercise.type === "select" && selected) {
      onSubmit({ optionId: selected });
      return;
    }
    onSubmit({ text });
  };

  const audioProgress = duration > 0 ? Math.min(1, position / duration) : 0;

  return (
    <View style={s.wrap}>
      {/* Player de áudio se existir */}
      {audioSource && (
        <View style={[s.audio, { borderColor: accentColor }]}>
          <TouchableOpacity style={[s.play, { backgroundColor: accentColor }]} onPress={togglePlay} activeOpacity={0.9}>
            <Text style={s.playText}>{isPlaying ? "Pausar" : "▶︎ Reproduzir"}</Text>
          </TouchableOpacity>
          <View style={s.audioRight}>
            <View style={s.audioBarBg}>
              <View style={[s.audioBarFill, { width: `${audioProgress * 100}%`, backgroundColor: accentColor }]} />
            </View>
            <Text style={s.audioTime}>
              {Math.round(position / 1000)}s / {Math.max(1, Math.round(duration / 1000))}s
            </Text>
          </View>
        </View>
      )}

      <Text style={s.prompt}>{exercise.prompt}</Text>

      {feedback && (
        <View style={[s.feedback, { backgroundColor: feedback.correct ? "#dcfce7" : "#fee2e2" }]}>
          <Text style={[s.feedbackText, { color: feedback.correct ? "#166534" : "#991b1b" }]}>
            {feedback.message ?? (feedback.correct ? "Correto!" : "Resposta incorreta")}
          </Text>
        </View>
      )}

      {exercise.type === "select" && exercise.options ? (
        <View>
          {exercise.options.map((op) => {
            const active = selected === op.id;
            return (
              <TouchableOpacity
                key={op.id}
                style={[
                  s.option,
                  { borderColor: active ? accentColor : "#e5e7eb", backgroundColor: active ? "#eef7ef" : "#fff" }
                ]}
                onPress={() => setSelected(op.id)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    s.radio,
                    { borderColor: active ? accentColor : "#cbd5e1", backgroundColor: active ? accentColor : "transparent" }
                  ]}
                />
                <Text style={s.optionText}>{op.text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View>
          <TextInput
            placeholder="Digite sua resposta"
            value={text}
            onChangeText={setText}
            style={s.input}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="send"
            onSubmitEditing={handleConfirm}
          />
        </View>
      )}

      <View style={s.footer}>
        <TouchableOpacity style={s.skip} onPress={onSkip} activeOpacity={0.8}>
          <Text style={s.skipText}>Pular</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.confirm, { backgroundColor: canConfirm ? accentColor : "#94a3b8" }]}
          onPress={handleConfirm}
          activeOpacity={0.9}
          disabled={!canConfirm}
        >
          <Text style={s.confirmText}>Confirmar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1 },
  prompt: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 12 },

  audio: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#fff"
  },
  play: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10
  },
  playText: { color: "#fff", fontWeight: "800" },
  audioRight: { flex: 1, marginLeft: 10 },
  audioBarBg: { height: 6, backgroundColor: "#e5e7eb", borderRadius: 999, overflow: "hidden" },
  audioBarFill: { height: 6, borderRadius: 999 },
  audioTime: { fontSize: 12, color: "#6b7280", marginTop: 6 },

  feedback: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 12 },
  feedbackText: { fontSize: 14, fontWeight: "700" },

  option: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10
  },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, marginRight: 10 },
  optionText: { fontSize: 16, color: "#111827" },

  input: {
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 8
  },

  footer: { flexDirection: "row", alignItems: "center", marginTop: "auto", gap: 10 },
  skip: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff"
  },
  skipText: { fontSize: 16, fontWeight: "700", color: "#6b7280" },

  confirm: { flex: 1.2, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  confirmText: { fontSize: 16, fontWeight: "800", color: "#fff" }
});
