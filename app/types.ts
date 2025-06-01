import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  uid: string;
  name: string;
  displayName?: string;
  email: string;
  emailVerified: boolean;
  role: 'patient' | 'therapist';
  therapistId?: string;
  clinicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  assignedTo?: string[];
  instructions?: string;
  reps?: number;
  sets?: number;
  holdTime?: number;
  restTime: number;
  patientId?: string;
  therapistId?: string;
  createdBy?: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedDate?: Date;
  completedDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: Date;
  streakHistory: Array<{
    date: Date;
    streakStatus: 'started' | 'continued' | 'broken' | 'none';
    completedBundles: string[];
  }>;
}

export interface Bundle {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  exercises: Exercise[];
  assignedPatients?: string[];
  frequency?: 'daily' | 'weekly' | 'custom';
  customDays?: string[];
  startDate?: Date;
  endDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completed?: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logoUrl?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  id: string;
  userId: string;
  videoEnabled: boolean;
  notificationsEnabled: boolean;
  streakReminderTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}