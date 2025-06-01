import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB_pqbcjziruYYqYU_LyisJPn53xlcS9Co",
  authDomain: "rpt-appdemo2.firebaseapp.com",
  projectId: "rpt-appdemo2",
  storageBucket: "rpt-appdemo2.firebasestorage.app",
  messagingSenderId: "318663061712",
  appId: "1:318663061712:web:175c675b3cca737d0aeed5",
  measurementId: "G-H9KQD99PLQ"
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

function initializeFirebase() {
  try {
    console.log('Starting Firebase initialization...');
    
    // Check for existing apps
    const existingApps = getApps();
    console.log(`Found ${existingApps.length} existing Firebase apps`);
    
    if (existingApps.length === 0) {
      console.log('Initializing new Firebase app...');
      app = initializeApp(firebaseConfig);
      console.log('Firebase app initialized successfully');
    } else {
      console.log('Using existing Firebase app...');
      app = getApp();
      console.log('Existing Firebase app retrieved successfully');
    }

    // Initialize services
    console.log('Initializing Firebase services...');
    
    try {
      auth = getAuth(app);
      console.log('Firebase Auth initialized');
    } catch (authError) {
      console.error('Failed to initialize Firebase Auth:', authError);
      throw authError;
    }

    try {
      db = getFirestore(app);
      console.log('Firestore initialized');
    } catch (firestoreError) {
      console.error('Failed to initialize Firestore:', firestoreError);
      throw firestoreError;
    }

    try {
      storage = getStorage(app);
      console.log('Firebase Storage initialized');
    } catch (storageError) {
      console.error('Failed to initialize Firebase Storage:', storageError);
      throw storageError;
    }

    // Add error handlers
    auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
    }, (error) => {
      console.error('Auth state change error:', error);
    });

    console.log('All Firebase services initialized successfully');
    return true;
  } catch (error) {
    console.error('Critical error during Firebase initialization:', error);
    
    // Try to recover
    try {
      console.log('Attempting recovery initialization...');
      app = initializeApp(firebaseConfig, 'recovery');
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
      console.log('Recovery initialization successful');
      return true;
    } catch (recoveryError) {
      console.error('Failed to recover Firebase initialization:', recoveryError);
      return false;
    }
  }
}

// Initialize Firebase immediately
const isInitialized = initializeFirebase();

if (!isInitialized) {
  throw new Error('Failed to initialize Firebase services');
}

export { app, auth, db, storage }; 