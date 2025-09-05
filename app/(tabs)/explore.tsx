// app/(tabs)/explore.tsx
import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useGameStore } from "../../src/store/useGameStore";
import { useQuestsStore } from "../../src/store/useQuestsStore";

const COLOR = {
  bg: "#fff",
  text: "#111827",
  muted: "#6b7280",
  card: "#f6f7f8",
  border: "#e5e7eb",
  primary: "#2e7d32",
  ok: "#16a34a"
};

type QuestVM = {
  id: string;
  title: string;
  scope: "daily" | "weekly";
  progress: number;
  target: number;
  rewardXp: number;
  claimed: boolean;
};

function Progress({ value }: { value: number }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={s.progressBg}>
      <View style={[s.progressFill, { width: `${v * 100}%` }]} />
    </View>
  );
}

function QuestCard({ q, onClaim }: { q: QuestVM; onClaim: (q: QuestVM) => void }) {
  const pct = Math.min(1, q.progress / q.target);
  const done = pct >= 1;

  return (
    <View style={s.card}>
      <View style={{ flex: 1 }}>
        <Text style={s.cardTitle}>{q.title}</Text>
        <Text style={s.cardMeta}>
          {Math.min(q.progress, q.target)} / {q.target} • Recompensa: {q.rewardXp} XP
        </Text>
        <View style={{ marginTop: 8 }}>
          <Progress value={pct} />
        </View>
      </View>

      <TouchableOpacity
        style={[
          s.claim,
          done && !q.claimed ? s.claimReady : q.claimed ? s.claimClaimed : s.claimDisabled
        ]}
        onPress={() => (done && !q.claimed ? onClaim(q) : null)}
        disabled={!done || q.claimed}
        activeOpacity={0.9}
      >
        <Text style={s.claimText}>
          {q.claimed ? "Resgatado" : done ? "Resgatar" : "Em progresso"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function Explore() {
  const { xp, hearts, streak, addXP, lastStudyAt } = useGameStore();
  const { xpSnapshot, claimedDaily, claimedWeekly, studiedDatesThisWeek, syncFromGame, claim } =
    useQuestsStore();

  // sincroniza resets e dias estudados
  useEffect(() => {
    syncFromGame({ xp, lastStudyAt });
  }, [xp, lastStudyAt]);

  const xpToday = Math.max(0, xp - (xpSnapshot || 0));
  const studiedToday = lastStudyAt === new Date().toDateString();

  const quests = useMemo<QuestVM[]>(() => {
    const daily: QuestVM[] = [
      {
        id: "d_xp_30",
        scope: "daily",
        title: "Ganhe 30 XP hoje",
        target: 30,
        progress: xpToday,
        rewardXp: 10,
        claimed: !!claimedDaily["d_xp_30"]
      },
      {
        id: "d_study_1",
        scope: "daily",
        title: "Conclua 1 lição hoje",
        target: 1,
        progress: studiedToday ? 1 : 0,
        rewardXp: 15,
        claimed: !!claimedDaily["d_study_1"]
      }
    ];

    const weekly: QuestVM[] = [
      {
        id: "w_days_5",
        scope: "weekly",
        title: "Estude em 5 dias nesta semana",
        target: 5,
        progress: studiedDatesThisWeek.length,
        rewardXp: 50,
        claimed: !!claimedWeekly["w_days_5"]
      }
    ];

    return [...daily, ...weekly];
  }, [xpToday, studiedToday, claimedDaily, claimedWeekly, studiedDatesThisWeek]);

  const onClaim = (q: QuestVM) => {
    // concede recompensa e marca como resgatado
    addXP(q.rewardXp);
    claim(q.scope, q.id);
  };

  const dailyList = quests.filter((q) => q.scope === "daily");
  const weeklyList = quests.filter((q) => q.scope === "weekly");

  return (
    <View style={s.container}>
      <Text style={s.title}>Missões</Text>
      <Text style={s.subtitle}>Complete objetivos para ganhar XP extra</Text>

      {/* KPIs da sessão */}
      <View style={s.kpis}>
        <View style={s.kpi}><Text style={s.kpiValue}>{xp}</Text><Text style={s.kpiLabel}>XP total</Text></View>
        <View style={s.kpi}><Text style={s.kpiValue}>{hearts}</Text><Text style={s.kpiLabel}>Vidas</Text></View>
        <View style={s.kpi}><Text style={s.kpiValue}>{streak}</Text><Text style={s.kpiLabel}>Streak</Text></View>
      </View>

      <Text style={s.section}>Diárias</Text>
      <FlatList
        data={dailyList}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <QuestCard q={item} onClaim={onClaim} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />

      <Text style={[s.section, { marginTop: 18 }]}>Semana</Text>
      <FlatList
        data={weeklyList}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <QuestCard q={item} onClaim={onClaim} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLOR.bg },
  title: { fontSize: 24, fontWeight: "800", color: COLOR.text, marginTop: 30, marginHorizontal: 16 },
  subtitle: { fontSize: 14, color: COLOR.muted, marginHorizontal: 16, marginBottom: 12 },

  kpis: { flexDirection: "row", gap: 12, paddingHorizontal: 16, marginBottom: 8 },
  kpi: {
    flex: 1,
    backgroundColor: COLOR.card,
    borderWidth: 1,
    borderColor: COLOR.border,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 10
  },
  kpiValue: { fontSize: 18, fontWeight: "800", color: COLOR.text },
  kpiLabel: { fontSize: 12, color: COLOR.muted, marginTop: 2 },

  section: { fontSize: 16, fontWeight: "700", color: COLOR.text, marginTop: 10, marginBottom: 8, marginHorizontal: 16 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLOR.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLOR.border
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: COLOR.text },
  cardMeta: { fontSize: 12, color: COLOR.muted, marginTop: 4 },
  progressBg: { height: 8, backgroundColor: "#e5e7eb", borderRadius: 999, overflow: "hidden" },
  progressFill: { height: 8, backgroundColor: COLOR.primary },
  claim: { marginLeft: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, minWidth: 100, alignItems: "center" },
  claimDisabled: { backgroundColor: "#e5e7eb" },
  claimReady: { backgroundColor: COLOR.primary },
  claimClaimed: { backgroundColor: COLOR.ok },
  claimText: { color: "#fff", fontWeight: "800" }
});
