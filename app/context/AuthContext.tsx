import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

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
  clearError: () => void;
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
            console.log('[AUTH] Firebase user details:', {
              uid: firebaseUser?.uid,
              email: firebaseUser?.email,
              emailVerified: firebaseUser?.emailVerified
            });
            
            if (firebaseUser) {
              // Only check email verification for newly created accounts
              if (!firebaseUser.emailVerified && isPendingVerification) {
                console.log('[AUTH] User not verified, staying in verification state');
                setUser(null);
                setLoading(false);
                setIsInitialized(true);
                return;
              }
              
              console.log('[AUTH] Fetching user document from Firestore...');
              const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
              
              if (userDoc.exists()) {
                const userData = userDoc.data();
                console.log('[AUTH] User document found:', userData);
                
                const user = {
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
                };
                
                console.log('[AUTH] Setting user:', user);
                setUser(user);
              } else {
                console.log('[AUTH] User document not found in Firestore, creating one...');
                // Create a basic user document if it doesn't exist
                const basicUserData = {
                  id: firebaseUser.uid,
                  uid: firebaseUser.uid,
                  name: firebaseUser.displayName || 'User',
                  email: firebaseUser.email || '',
                  emailVerified: firebaseUser.emailVerified,
                  role: 'patient', // Default to patient
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                };
                
                try {
                  await setDoc(doc(db, 'users', firebaseUser.uid), basicUserData);
                  console.log('[AUTH] Created user document successfully');
                  
                  const user = {
                    id: firebaseUser.uid,
                    uid: firebaseUser.uid,
                    name: basicUserData.name,
                    displayName: firebaseUser.displayName || undefined,
                    email: basicUserData.email,
                    emailVerified: firebaseUser.emailVerified,
                    role: basicUserData.role as 'patient' | 'therapist',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };
                  
                  console.log('[AUTH] Setting user:', user);
                  setUser(user);
                } catch (createError) {
                  console.error('[AUTH] Error creating user document:', createError);
                  await firebaseSignOut(auth);
                  setUser(null);
                }
              }
            } else {
              console.log('[AUTH] No Firebase user, setting user to null');
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
  }, [isPendingVerification]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[AUTH] Starting sign in process...');
      setError(null);
      
      console.log('[AUTH] Calling signInWithEmailAndPassword...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('[AUTH] Sign in successful:', userCredential.user.uid);
      
      // Don't set loading to false here - let the auth state listener handle it
    } catch (error) {
      console.error('[AUTH] Sign in error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('auth/user-not-found')) {
          setError('No account found with this email address.');
        } else if (error.message.includes('auth/wrong-password')) {
          setError('Incorrect password. Please try again.');
        } else if (error.message.includes('auth/invalid-email')) {
          setError('Please enter a valid email address.');
        } else if (error.message.includes('auth/too-many-requests')) {
          setError('Too many failed attempts. Please try again later.');
        } else if (error.message.includes('auth/api-key-not-valid')) {
          setError('Authentication service error. Please try again later.');
        } else {
          setError('Failed to sign in. Please check your credentials.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      throw error;
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

      // Check if there's an existing patient record with this email
      let existingPatientData: any = null;
      if (role === 'patient') {
        try {
          const patientsQuery = query(
            collection(db, 'patients'),
            where('email', '==', email)
          );
          const patientsSnapshot = await getDocs(patientsQuery);
          
          if (!patientsSnapshot.empty) {
            const patientDoc = patientsSnapshot.docs[0];
            existingPatientData = { id: patientDoc.id, ...patientDoc.data() };
            console.log('[AUTH] Found existing patient record:', existingPatientData);
          }
        } catch (error) {
          console.error('[AUTH] Error checking for existing patient:', error);
        }
      }

      const userData = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        name,
        email,
        emailVerified: false,
        role,
        therapistId: existingPatientData?.therapistId, // Link to existing therapist if found
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);

      // If there's an existing patient record, update it to link to the new user account
      if (existingPatientData) {
        try {
          await updateDoc(doc(db, 'patients', existingPatientData.id), {
            userId: firebaseUser.uid,
            isAppUser: true,
            status: 'accepted',
            updatedAt: serverTimestamp(),
          });

          // Update any notifications sent to this email to include the user ID
          const notificationsQuery = query(
            collection(db, 'notifications'),
            where('toEmail', '==', email)
          );
          const notificationsSnapshot = await getDocs(notificationsQuery);
          
          const updatePromises = notificationsSnapshot.docs.map(doc => 
            updateDoc(doc.ref, {
              toUserId: firebaseUser.uid,
              updatedAt: serverTimestamp(),
            })
          );
          
          await Promise.all(updatePromises);
          console.log('[AUTH] Updated existing patient record and notifications');
        } catch (error) {
          console.error('[AUTH] Error updating existing patient record:', error);
        }
      }

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

  const clearError = () => {
    setError(null);
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
    clearError,
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