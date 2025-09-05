import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGameStore } from "./useGameStore";
import { scheduleNext } from "../utils/sm2";
import { saveProgress } from "../services/db";
import lessonsData from "../../assets/data/lessons.json";

export type Option = { id: string; text: string; isCorrect?: boolean };
export type Exercise = {
  id: string;
  type: "select" | "type" | "translate" | "listen";
  prompt: string;
  answer: string;
  options?: Option[];
  audioUri?: string;
};
export type Lesson = { id: string; title: string; exercises: Exercise[] };

type State = {
  lessons: Lesson[];
  progressByLesson: Record<string, number>; // 0..1
  currentLessonId?: string;
  index: number;
  currentExercise?: Exercise;
  isFinished: boolean;
  loadLessons: () => void;
  startLesson: (id: string) => void;
  next: () => void;
  submitAnswer: (payload: { optionId?: string; text?: string }) => Promise<{ correct: boolean; finished: boolean }>;
  titleForCurrent: () => string;
};

const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();

export const useLessonStore = create<State>()(
  persist(
    (set, get) => ({
      lessons: [],
      progressByLesson: {},
      index: 0,
      isFinished: false,
      loadLessons: () => {
        const parsed = lessonsData as Lesson[];
        set({ lessons: parsed });
      },
      startLesson: (id) => {
        const l = get().lessons.find((x) => x.id === id);
        if (!l) return;
        set({
          currentLessonId: id,
          index: 0,
          currentExercise: l.exercises[0],
          isFinished: false
        });
      },
      next: () => {
        const { currentLessonId, index, lessons } = get();
        const l = lessons.find((x) => x.id === currentLessonId);
        if (!l) return;
        const i = index + 1;
        if (i >= l.exercises.length) {
          set({ isFinished: true, currentExercise: undefined });
          // progresso 100%
          const pb = { ...get().progressByLesson, [l.id]: 1 };
          set({ progressByLesson: pb });
          saveProgress(l.id, 1).catch(() => {});
          useGameStore.getState().bumpStreak();
          return;
        }
        set({ index: i, currentExercise: l.exercises[i] });
        const pb = { ...get().progressByLesson, [l.id]: i / l.exercises.length };
        set({ progressByLesson: pb });
        saveProgress(l.id, pb[l.id]).catch(() => {});
      },
      submitAnswer: async ({ optionId, text }) => {
        const ex = get().currentExercise;
        const game = useGameStore.getState();
        if (!ex) return { correct: false, finished: false };

        let correct = false;
        if (ex.type === "select" && ex.options) {
          const chosen = ex.options.find((o) => o.id === optionId);
          correct = Boolean(chosen?.isCorrect);
        } else {
          correct = normalize(text ?? "") === normalize(ex.answer);
        }

        if (correct) {
          game.addXP(10);
          // agendamento simples de revisão
          scheduleNext({ lastInterval: 1, easiness: 2.5, quality: 4 });
        } else {
          game.loseHeart();
        }

        const { currentLessonId, index, lessons } = get();
        const l = lessons.find((x) => x.id === currentLessonId);
        const finished = !!l && index + 1 >= (l?.exercises.length ?? 0);
        return { correct, finished };
      },
      titleForCurrent: () => {
        const { currentLessonId, lessons } = get();
        const l = lessons.find((x) => x.id === currentLessonId);
        return l?.title ?? "Lição";
      }
    }),
    { name: "lessons", storage: createJSONStorage(() => AsyncStorage) }
  )
);
