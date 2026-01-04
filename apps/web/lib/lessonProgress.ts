"use client";

/**
 * Lesson Progress Tracking
 *
 * React hooks and localStorage utilities for tracking completed lessons.
 * Uses TanStack Query for state management with localStorage persistence.
 *
 * For static lesson data, see lessons.ts.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { safeGetJSON, safeSetJSON } from "./utils";
import {
  LESSONS,
  TOTAL_LESSONS,
  type Lesson,
  getLessonById,
  getLessonBySlug,
  getNextLesson,
  getPreviousLesson,
} from "./lessons";

// Re-export static data for backwards compatibility
export {
  LESSONS,
  TOTAL_LESSONS,
  type Lesson,
  getLessonById,
  getLessonBySlug,
  getNextLesson,
  getPreviousLesson,
};

/** localStorage key for storing completed lessons */
export const COMPLETED_LESSONS_KEY = "acfs-learning-hub-completed-lessons";

export const COMPLETED_LESSONS_CHANGED_EVENT =
  "acfs:learning-hub:completed-lessons-changed";

// Query keys for TanStack Query
export const lessonProgressKeys = {
  completedLessons: ["lessonProgress", "completed"] as const,
};

type CompletedLessonsChangedDetail = {
  lessons: number[];
};

function normalizeCompletedLessons(lessons: readonly unknown[]): number[] {
  const validLessons = lessons.filter(
    (n): n is number =>
      typeof n === "number" &&
      Number.isInteger(n) &&
      n >= 0 &&
      n < TOTAL_LESSONS
  );
  return Array.from(new Set(validLessons)).sort((a, b) => a - b);
}

function emitCompletedLessonsChanged(lessons: number[]): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<CompletedLessonsChangedDetail>(COMPLETED_LESSONS_CHANGED_EVENT, {
      detail: { lessons },
    })
  );
}

/** Get completed lesson IDs from localStorage */
export function getCompletedLessons(): number[] {
  const parsed = safeGetJSON<unknown[]>(COMPLETED_LESSONS_KEY);
  if (Array.isArray(parsed)) {
    return normalizeCompletedLessons(parsed);
  }
  return [];
}

/** Save completed lessons to localStorage */
export function setCompletedLessons(lessons: number[]): void {
  const normalized = normalizeCompletedLessons(lessons);
  safeSetJSON(COMPLETED_LESSONS_KEY, normalized);
  emitCompletedLessonsChanged(normalized);
}

/** Mark a lesson as completed (pure function, returns new array) */
export function addCompletedLesson(
  currentLessons: number[],
  lessonId: number
): number[] {
  if (currentLessons.includes(lessonId)) {
    return currentLessons;
  }
  const newLessons = [...currentLessons, lessonId];
  newLessons.sort((a, b) => a - b);
  return newLessons;
}

/** Calculate completion percentage */
export function getCompletionPercentage(completedLessons: number[]): number {
  if (TOTAL_LESSONS === 0) return 0;
  return Math.round((completedLessons.length / TOTAL_LESSONS) * 100);
}

/** Get the suggested next lesson to work on */
export function getNextUncompletedLesson(
  completedLessons: number[]
): Lesson | undefined {
  return LESSONS.find((lesson) => !completedLessons.includes(lesson.id));
}

// --- React Hooks using TanStack Query ---

/**
 * Hook to get and manage completed lessons.
 * Uses TanStack Query for state management with localStorage persistence.
 */
export function useCompletedLessons(): [number[], (lessonId: number) => void] {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleCompletedLessonsChanged = (event: Event) => {
      const customEvent = event as CustomEvent<CompletedLessonsChangedDetail>;
      const nextLessons = customEvent.detail?.lessons ?? getCompletedLessons();
      queryClient.setQueryData(
        lessonProgressKeys.completedLessons,
        normalizeCompletedLessons(nextLessons)
      );
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== COMPLETED_LESSONS_KEY) return;
      queryClient.setQueryData(lessonProgressKeys.completedLessons, getCompletedLessons());
    };

    window.addEventListener(
      COMPLETED_LESSONS_CHANGED_EVENT,
      handleCompletedLessonsChanged as EventListener
    );
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        COMPLETED_LESSONS_CHANGED_EVENT,
        handleCompletedLessonsChanged as EventListener
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, [queryClient]);

  const { data: lessons } = useQuery({
    queryKey: lessonProgressKeys.completedLessons,
    queryFn: getCompletedLessons,
    staleTime: 0,
    gcTime: Infinity,
  });

  const mutation = useMutation({
    mutationFn: async (lessonId: number) => {
      // Use query cache as source of truth to avoid race conditions when
      // markComplete is called rapidly multiple times. Falls back to
      // localStorage for initial hydration.
      const cachedLessons = queryClient.getQueryData<number[]>(
        lessonProgressKeys.completedLessons
      );
      const currentLessons = normalizeCompletedLessons(
        cachedLessons ?? getCompletedLessons()
      );
      const newLessons = addCompletedLesson(currentLessons, lessonId);
      setCompletedLessons(newLessons);
      return newLessons;
    },
    onMutate: async (lessonId) => {
      await queryClient.cancelQueries({
        queryKey: lessonProgressKeys.completedLessons,
      });

      const cachedLessons = queryClient.getQueryData<number[]>(
        lessonProgressKeys.completedLessons
      );

      const baseLessons = normalizeCompletedLessons(
        cachedLessons ?? getCompletedLessons()
      );
      const newLessons = addCompletedLesson(baseLessons, lessonId);
      queryClient.setQueryData(lessonProgressKeys.completedLessons, newLessons);

      return { previousLessons: cachedLessons };
    },
    onError: (_err, _lessonId, context) => {
      if (context?.previousLessons !== undefined) {
        queryClient.setQueryData(
          lessonProgressKeys.completedLessons,
          normalizeCompletedLessons(context.previousLessons)
        );
      } else {
        queryClient.invalidateQueries({
          queryKey: lessonProgressKeys.completedLessons,
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: lessonProgressKeys.completedLessons,
      });
    },
  });

  const markComplete = useCallback(
    (lessonId: number) => {
      mutation.mutate(lessonId);
    },
    [mutation]
  );

  return [lessons ?? [], markComplete];
}

/**
 * Imperatively mark a lesson as complete (for use outside React components).
 * This writes to localStorage and notifies any mounted `useCompletedLessons()`
 * hooks via a DOM event.
 */
export function markLessonComplete(lessonId: number): number[] {
  const completed = getCompletedLessons();
  const newLessons = addCompletedLesson(completed, lessonId);
  if (newLessons !== completed) {
    setCompletedLessons(newLessons);
  }
  return newLessons;
}
