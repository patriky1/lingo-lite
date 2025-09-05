import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert
} from "react-native";
import { useLessonStore } from "../../src/store/useLessonStore";
import { useGameStore } from "../../src/store/useGameStore";
import ExerciseRenderer from "../../src/components/ExerciseRenderer";
import ProgressBar from "../../src/components/ProgressBar";

export default function Lesson() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    startLesson,
    currentExercise,
    submitAnswer,
    next,
    isFinished,
    titleForCurrent,
    lessons,
    index,
    progressByLesson
  } = useLessonStore();

  const { hearts, xp } = useGameStore();

  const [feedback, setFeedback] = useState<null | { correct: boolean; message?: string }>(null);

  const currentTitle = titleForCurrent();
  const accent = useMemo(() => {
    // cor por módulo (pode ajustar como quiser)
    if (/sauda(ç|c)ões/i.test(currentTitle)) return "#2e7d32"; // verde
    if (/b(á|a)sico/i.test(currentTitle)) return "#2563eb";   // azul
    return "#6d28d9"; // fallback roxo
  }, [currentTitle]);

  // total de exercícios da lição atual
  const total = useMemo(() => {
    const l = lessons.find((x) => x.id === id);
    return l?.exercises.length ?? 0;
  }, [lessons, id]);

  const progress = useMemo(() => {
    if (!id) return 0;
    return progressByLesson[id] ?? (total ? index / total : 0);
  }, [progressByLesson, id, total, index]);

  useEffect(() => {
    if (id) startLesson(id);
  }, [id]);

  useEffect(() => {
    if (hearts <= 0) {
      Alert.alert("Fim das vidas", "Você ficou sem vidas. Volte depois ou recarregue no Perfil.");
      router.back();
    }
  }, [hearts]);

  const handleSubmit = async (payload: { optionId?: string; text?: string }) => {
    const res = await submitAnswer(payload);
    setFeedback(
      res.correct
        ? { correct: true, message: "Boa!" }
        : { correct: false, message: "Quase lá. Tente de novo." }
    );

    if (res.correct) {
      // pequena pausa para o usuário ver o feedback antes de ir adiante
      setTimeout(() => {
        setFeedback(null);
        if (res.finished) {
          Alert.alert("Lição concluída 🎉", "Você terminou esta lição.");
        } else {
          next();
        }
      }, 400);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[s.back, { color: accent }]}>Voltar</Text>
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <Text style={s.title}>{currentTitle}</Text>
          <Text style={s.meta}>
            {total > 0 ? `Exercício ${Math.min(index + 1, total)} de ${total}` : "Carregando..."}
          </Text>
        </View>

        <View style={s.kpis}>
          <Text style={s.kpi}>❤️ {hearts}</Text>
          <Text style={s.kpi}>⭐ {xp}</Text>
        </View>
      </View>

      {/* Barra de progresso */}
      <View style={s.progressWrap}>
        <ProgressBar value={progress} />
      </View>

      {/* Card de exercício */}
      <View style={[s.card, { borderColor: accent }]}>
        {!currentExercise ? (
          <Text style={s.loading}>{isFinished ? "Lição concluída! 🎉" : "Carregando..."}</Text>
        ) : (
          <ExerciseRenderer
            exercise={currentExercise}
            accentColor={accent}
            onSubmit={handleSubmit}
            onSkip={() => next()}
            feedback={feedback ?? undefined}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff", top:25 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6
  },
  back: { fontSize: 16, fontWeight: "700" },
  headerCenter: { flex: 1, alignItems: "center" },
  title: { fontSize: 18, fontWeight: "800", color: "#111827" },
  meta: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  kpis: { minWidth: 96, alignItems: "flex-end" },
  kpi: { fontWeight: "700", color: "#111827" },

  progressWrap: { paddingHorizontal: 16, paddingBottom: 8, paddingTop: 2 },

  card: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 65,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: "#f9fafb",
    padding: 16
  },
  loading: { fontSize: 16, color: "#6b7280", textAlign: "center", marginTop: 24 }
});
