import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type GameState = {
  xp: number;
  hearts: number; // 0..5
  streak: number;
  lastStudyAt?: string;
  addXP: (v: number) => void;
  loseHeart: () => void;
  refillHearts: () => void;
  bumpStreak: () => void;
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      xp: 0,
      hearts: 5,
      streak: 0,
      addXP: (v) => set({ xp: get().xp + v }),
      loseHeart: () => set({ hearts: Math.max(0, get().hearts - 1) }),
      refillHearts: () => set({ hearts: 5 }),
      bumpStreak: () => {
        const today = new Date().toDateString();
        if (get().lastStudyAt === today) return;
        set({ streak: get().streak + 1, lastStudyAt: today });
      }
    }),
    { name: "game", storage: createJSONStorage(() => AsyncStorage) }
  )
);
