export interface Exercise {
  id: string;
  name: string;
  reps?: number;
  duration?: number;
  image?: string;
}

export interface BundleExercise extends Exercise {
  bundleId: string;
  exerciseIndex: number; // Unique index within the bundle
}

export interface Bundle {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  exercises: BundleExercise[];
  therapistId: string;
} 