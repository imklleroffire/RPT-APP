export interface Exercise {
  id: string;
  name: string;
  reps?: number;
  duration?: number;
  image?: string;
  videoUrl?: string;
  description?: string;
}

export interface Bundle {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  exercises: Exercise[];
  therapistId: string;
} 