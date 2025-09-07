export interface CompletedExercise {
  exerciseId: string;
  exerciseName: string;
  bundleId: string;
  bundleName: string;
  completedAt: Date;
  completed: boolean;
}

export interface DailyCompletion {
  date: string; // YYYY-MM-DD format
  exercises: CompletedExercise[];
  totalAssigned: number;
  totalCompleted: number;
  completionRate: number; // 0-100
  streakStatus: 'maintained' | 'started' | 'broken' | 'none';
  allExercisesCompleted: boolean;
}

export interface StreakData {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
  totalDaysActive: number;
  totalExercisesCompleted: number;
  averageCompletionRate: number;
  streakHistory: DailyCompletion[];
  lastUpdated: Date;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
  totalExercisesCompleted: number;
  averageCompletionRate: number;
  streakPercentage: number; // Percentage of days with streaks
  bestWeek: {
    startDate: string;
    endDate: string;
    exercisesCompleted: number;
  };
  currentWeekProgress: {
    exercisesCompleted: number;
    totalAssigned: number;
    completionRate: number;
  };
}

export type StreakEmoji = '🔥' | '❌' | '😐' | '🎯' | '💪' | '🏆';

export interface StreakAchievement {
  id: string;
  name: string;
  description: string;
  emoji: StreakEmoji;
  unlocked: boolean;
  unlockedDate?: Date;
  requirement: {
    type: 'streak_days' | 'total_exercises' | 'completion_rate' | 'perfect_week';
    value: number;
  };
}
