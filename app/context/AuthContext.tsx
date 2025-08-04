import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { auth, db } from '../../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

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
  const [loading, setLoading] = useState(true); // Start with loading=true
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false); // Start with false
  const [isPendingVerification, setIsPendingVerification] = useState(false);

  // Function to clear all auth state
  const clearAuthState = useCallback(() => {
    setUser(null);
    setError(null);
    setIsPendingVerification(false);
    setLoading(false);
  }, []);

  // Setup auth state listener
  useEffect(() => {
    let unsub: (() => void) | null = null;

    async function start() {
      try {
        console.log('[AUTH] Setting up auth state listener...');
        setLoading(true);
        
        // Setup auth state listener using Firebase Web SDK
        unsub = onAuthStateChanged(auth, async (firebaseUser) => {
          try {
            console.log('[AUTH] Auth state changed:', !!firebaseUser);
            if (firebaseUser) {
              // Only check email verification for newly created accounts
              if (!firebaseUser.emailVerified && isPendingVerification) {
                setUser(null);
                setLoading(false);
                setIsInitialized(true);
                return;
              }
              const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                setUser({
                  id: firebaseUser.uid,
                  uid: firebaseUser.uid,
                  name: userData?.name || '',
                  displayName: firebaseUser.displayName || undefined,
                  email: userData?.email || firebaseUser.email || '',
                  emailVerified: firebaseUser.emailVerified,
                  role: userData?.role || 'patient',
                  therapistId: userData?.therapistId,
                  createdAt: userData?.createdAt?.toDate?.() || new Date(),
                  updatedAt: userData?.updatedAt?.toDate?.() || new Date(),
                });
              } else {
                await firebaseSignOut(auth);
                setUser(null);
              }
            } else {
              setUser(null);
            }
          } catch (error) {
            console.error('[AUTH] Error in auth state change:', error);
            setUser(null);
          } finally {
            setLoading(false);
            setIsInitialized(true);
          }
        });

      } catch (error) {
        console.error('[AUTH] Error setting up auth listener:', error);
        setLoading(false);
        setIsInitialized(true);
      }
    }

    start();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      if (error instanceof Error) {
        if (error.message.includes('auth/user-not-found')) {
          setError('No account found with this email address.');
        } else if (error.message.includes('auth/wrong-password')) {
          setError('Incorrect password. Please try again.');
        } else if (error.message.includes('auth/invalid-email')) {
          setError('Please enter a valid email address.');
        } else if (error.message.includes('auth/too-many-requests')) {
          setError('Too many failed attempts. Please try again later.');
        } else {
          setError('Failed to sign in. Please check your credentials.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
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
      const firebaseUser = userCredential.user;
      
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
      await firebaseSignOut(auth);
      clearAuthState();
    } catch (error) {
      console.error('Sign out error:', error);
      setError('Failed to sign out. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        await deleteDoc(doc(db, 'users', currentUser.uid));
        await currentUser.delete();
        clearAuthState();
      }
    } catch (error) {
      console.error('Delete account error:', error);
      setError('Failed to delete account. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const setPendingVerification = (pending: boolean) => {
    setIsPendingVerification(pending);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    deleteAccount,
    setPendingVerification,
    isPendingVerification,
  };

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Initializing...</Text>
      </View>
    );
  }

  return (
    <AuthContext.Provider value={value}>
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