import { Timestamp, FieldValue } from 'firebase/firestore';

export type FirebaseTimestamp = Timestamp;
export type FirebaseFieldValue = FieldValue;

export interface BaseExercise {
  name: string;
  description: string;
  instructions?: string;
  imageUrl?: string;
  duration?: number;
  reps?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  assignedTo?: string[];
  createdBy: string;
  restTime?: number;
  status?: 'completed' | 'pending' | 'in_progress';
}

export interface Exercise extends BaseExercise {
  id: string;
  name: string;
  description: string;
  instructions: string;
  imageUrl: string;
  duration: number;
  reps: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  assignedTo: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  restTime: number;
  status: 'completed' | 'pending' | 'in_progress';
}

export interface FirestoreExercise extends BaseExercise {
  id: string;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

export interface BaseBundle {
  name: string;
  description: string;
  coverImage: string;
  exercises: Exercise[];
  assignedPatients?: string[];
  createdBy: string;
  frequency?: 'daily' | 'weekly' | 'custom';
  customDays?: string[];
  completed?: boolean;
}

export interface Bundle extends BaseBundle {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  exercises: Exercise[];
  assignedPatients: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  frequency: 'daily' | 'weekly' | 'custom';
  customDays: string[];
  completed: boolean;
}

export interface FirestoreBundle extends BaseBundle {
  id: string;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

// Helper type for creating new exercises
export interface NewExercise extends Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Helper type for creating new bundles
export interface NewBundle extends Omit<Bundle, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
} 