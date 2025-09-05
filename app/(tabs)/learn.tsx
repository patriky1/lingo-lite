import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  SafeAreaView
} from "react-native";
import { useRouter } from "expo-router";
import { useLessonStore } from "../../src/store/useLessonStore";
import { useGameStore } from "../../src/store/useGameStore";
import ProgressBar from "../../src/components/ProgressBar";

function KPIChip({ label, value, emoji }: { label: string; value: string | number; emoji?: string }) {
  return (
    <View style={s.kpiChip}>
      {!!emoji && <Text style={s.kpiEmoji}>{emoji}</Text>}
      <View>
        <Text style={s.kpiValue}>{value}</Text>
        <Text style={s.kpiLabel}>{label}</Text>
      </View>
    </View>
  );
}

function LessonItem({
  id,
  title,
  exercisesCount,
  progress,
  onPress
}: {
  id: string;
  title: string;
  exercisesCount: number;
  progress: number;
  onPress: () => void;
}) {
  // escolhe um “ícone” simples pelo id só para variar
  const badge = useMemo(() => {
    const map = ["🟢", "🟣", "🔵", "🟠", "🟡"];
    return map[Math.abs(id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % map.length];
  }, [id]);

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <View style={s.cardLeft}>
        <Text style={s.badge}>{badge}</Text>
      </View>

      <View style={s.cardBody}>
        <Text style={s.cardTitle} numberOfLines={1}>{title}</Text>
        <Text style={s.cardMeta}>{exercisesCount} exercícios</Text>
        <View style={{ marginTop: 10 }}>
          <ProgressBar value={progress} />
        </View>
      </View>

      <View style={s.cardCta}>
        <Text style={s.cardCtaText}>{progress >= 1 ? "Revisar" : "Começar"}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function Learn() {
  const router = useRouter();
  const { lessons, loadLessons, progressByLesson } = useLessonStore();
  const { xp, hearts, streak } = useGameStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLessons();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      loadLessons();
      await new Promise((r) => setTimeout(r, 400));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <FlatList
        data={lessons}
        keyExtractor={(l) => l.id}
        contentContainerStyle={s.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            <View style={s.header}>
              <View>
                <Text style={s.greeting}>Olá</Text>
                <Text style={s.subtitle}>Vamos praticar hoje?</Text>
              </View>
            </View>

            <View style={s.kpiRow}>
              <KPIChip label="XP" value={xp} emoji="⭐" />
              <KPIChip label="Vidas" value={hearts} emoji="❤️" />
              <KPIChip label="Streak" value={streak} emoji="🔥" />
            </View>

            <Text style={s.sectionTitle}>Lições</Text>
          </>
        }
        renderItem={({ item }) => {
          const prog = progressByLesson[item.id] ?? 0;
          return (
            <LessonItem
              id={item.id}
              title={item.title}
              exercisesCount={item.exercises.length}
              progress={prog}
              onPress={() => router.push({ pathname: "/lesson/[id]", params: { id: item.id } })}
            />
          );
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTitle}>Nada por aqui ainda</Text>
            <Text style={s.emptyText}>Adicione lições ao arquivo assets/data/lessons.json</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const COLOR = {
  bg: "#ffffff",
  muted: "#6b7280",
  // verde principal
  primary: "#2e7d32",
  // cinzas do card
  card: "#f6f7f8",
  border: "#e5e7eb",
  text: "#111827"
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  listContent: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingVertical: 8,
    top:20
  },
  greeting: { fontSize: 24, fontWeight: "800", color: COLOR.text },
  subtitle: { fontSize: 14, color: COLOR.muted, marginTop: 4 },

  kpiRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    marginBottom: 16
  },
  kpiChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLOR.card,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLOR.border
  },
  kpiEmoji: { fontSize: 22, marginRight: 10 },
  kpiValue: { fontSize: 18, fontWeight: "800", color: COLOR.text },
  kpiLabel: { fontSize: 12, color: COLOR.muted, marginTop: 2 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 10,
    color: COLOR.text
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLOR.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLOR.border
  },
  cardLeft: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eef3ee",
    marginRight: 12
  },
  badge: { fontSize: 22 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: COLOR.text },
  cardMeta: { fontSize: 12, color: COLOR.muted, marginTop: 4 },
  cardCta: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLOR.primary,
    backgroundColor: "#eaf4eb",
    marginLeft: 10
  },
  cardCtaText: { fontSize: 12, fontWeight: "700", color: COLOR.primary },

  empty: { alignItems: "center", paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: COLOR.text, marginBottom: 6 },
  emptyText: { color: COLOR.muted }
});
