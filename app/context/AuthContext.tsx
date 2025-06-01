import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  deleteUser,
  sendEmailVerification,
  Auth,
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface User {
  id: string;
  uid: string;
  name: string;
  displayName?: string;
  email: string;
  emailVerified: boolean;
  role: 'patient' | 'therapist';
  therapistId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: 'patient' | 'therapist') => Promise<boolean>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  setPendingVerification: (pending: boolean) => void;
  isPendingVerification: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPendingVerification, setIsPendingVerification] = useState(false);
  const [authStateListener, setAuthStateListener] = useState<(() => void) | null>(null);

  // Function to clear all auth state
  const clearAuthState = useCallback(() => {
    setUser(null);
    setError(null);
    setIsPendingVerification(false);
    setLoading(false);
  }, []);

  // Function to initialize auth state listener
  const initializeAuthListener = useCallback(() => {
    if (authStateListener) {
      authStateListener();
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Only check email verification for newly created accounts
          if (!firebaseUser.emailVerified && isPendingVerification) {
            clearAuthState();
            setIsInitialized(true);
            return;
          }

          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              name: userData.name,
              displayName: firebaseUser.displayName || undefined,
              email: userData.email,
              emailVerified: firebaseUser.emailVerified,
              role: userData.role,
              therapistId: userData.therapistId,
              createdAt: userData.createdAt?.toDate?.() || new Date(),
              updatedAt: userData.updatedAt?.toDate?.() || new Date(),
            });
          } else {
            await firebaseSignOut(auth);
            clearAuthState();
          }
        } else {
          clearAuthState();
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error);
        clearAuthState();
      } finally {
        setIsInitialized(true);
      }
    });

    setAuthStateListener(() => unsubscribe);
    return unsubscribe;
  }, [clearAuthState, isPendingVerification]);

  // Initialize auth listener on mount
  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    return () => {
      unsubscribe();
      if (authStateListener) {
        authStateListener();
      }
    };
  }, [initializeAuthListener]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, role: 'patient' | 'therapist') => {
    try {
      setLoading(true);
      setError(null);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user: firebaseUser } = userCredential;
      
      if (!firebaseUser) {
        throw new Error('Failed to create user account');
      }

      const userData = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        name,
        email,
        emailVerified: false,
        role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      await sendEmailVerification(firebaseUser);
      setIsPendingVerification(true);
      clearAuthState();
      return true;
    } catch (error) {
      console.error('Sign up error:', error);
      if (error instanceof Error) {
        if (error.message.includes('auth/email-already-in-use')) {
          setError('This email is already registered. Please use a different email or sign in.');
        } else if (error.message.includes('auth/invalid-email')) {
          setError('Please enter a valid email address.');
        } else if (error.message.includes('auth/weak-password')) {
          setError('Password should be at least 6 characters long.');
        } else {
          setError('Failed to sign up. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear local state first
      clearAuthState();
      
      // Then sign out from Firebase
      await firebaseSignOut(auth);
      
      // Force reinitialize auth listener
      initializeAuthListener();
      
    } catch (error) {
      console.error('Sign out error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign out');
      clearAuthState();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!auth.currentUser) return;
    try {
      setLoading(true);
      setError(null);
      await deleteUser(auth.currentUser);
      clearAuthState();
    } catch (error) {
      console.error('Delete account error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete account');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const setPendingVerification = (pending: boolean) => {
    setIsPendingVerification(pending);
  };

  if (!isInitialized || loading) {
    return (
      <View 
        style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: '#fff'
        }}
        pointerEvents="none"
      >
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        deleteAccount,
        setPendingVerification,
        isPendingVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider; 