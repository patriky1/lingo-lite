// src/store/useQuestsStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type QuestsState = {
  dailyKey: string;           // ex: 2025-09-05
  weeklyKey: string;          // ex: 2025-W36 (ISO week)
  xpSnapshot: number;         // XP no começo do dia, para medir XP de hoje
  claimedDaily: Record<string, boolean>;
  claimedWeekly: Record<string, boolean>;
  studiedDatesThisWeek: string[]; // dias estudados (YYYY-MM-DD) na semana

  syncFromGame: (game: { xp: number; lastStudyAt?: string }) => void;
  claim: (scope: "daily" | "weekly", id: string) => void;
  resetAll: () => void;
};

function todayStr(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
}

// ISO week key: YYYY-W## (segunda = 1)
function isoWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // quinta-feira determina o ano ISO
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
  const yy = d.getUTCFullYear();
  const ww = String(weekNo).padStart(2, "0");
  return `${yy}-W${ww}`;
}

export const useQuestsStore = create<QuestsState>()(
  persist(
    (set, get) => ({
      dailyKey: todayStr(),
      weeklyKey: isoWeekKey(),
      xpSnapshot: 0,
      claimedDaily: {},
      claimedWeekly: {},
      studiedDatesThisWeek: [],

      syncFromGame: (game) => {
        const t = todayStr();
        const wk = isoWeekKey();

        // troca de dia: reseta diárias e tira um novo snapshot de XP
        if (get().dailyKey !== t) {
          set({ dailyKey: t, claimedDaily: {}, xpSnapshot: game.xp });
        } else if (get().xpSnapshot === 0 && game.xp > 0) {
          // primeiro boot do dia sem snapshot
          set({ xpSnapshot: game.xp });
        }

        // troca de semana: reseta semanais
        if (get().weeklyKey !== wk) {
          set({ weeklyKey: wk, claimedWeekly: {}, studiedDatesThisWeek: [] });
        }

        // marca dia estudado (se lastStudyAt === hoje)
        if (game.lastStudyAt === t) {
          const arr = new Set(get().studiedDatesThisWeek);
          arr.add(t);
          set({ studiedDatesThisWeek: Array.from(arr) });
        }
      },

      claim: (scope, id) => {
        if (scope === "daily") {
          set({ claimedDaily: { ...get().claimedDaily, [id]: true } });
        } else {
          set({ claimedWeekly: { ...get().claimedWeekly, [id]: true } });
        }
      },

      resetAll: () =>
        set({
          dailyKey: todayStr(),
          weeklyKey: isoWeekKey(),
          xpSnapshot: 0,
          claimedDaily: {},
          claimedWeekly: {},
          studiedDatesThisWeek: []
        })
    }),
    { name: "quests", storage: createJSONStorage(() => AsyncStorage) }
  )
);
