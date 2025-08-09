// Firebase Web SDK configuration (works on iOS, Android, and Web)
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyB_pqbcjziruYYqYU_LyisJPn53xlcS9Co",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "rpt-appdemo2.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "rpt-appdemo2",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "rpt-appdemo2.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "318663061712",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:318663061712:web:175c675b3cca737d0aeed5",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-H9KQD99PLQ"
};

console.log('Environment variables check:');
console.log('EXPO_PUBLIC_FIREBASE_API_KEY:', process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'NOT SET');
console.log('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:', process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN);
console.log('EXPO_PUBLIC_FIREBASE_PROJECT_ID:', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID);
console.log('EXPO_PUBLIC_FIREBASE_APP_ID:', process.env.EXPO_PUBLIC_FIREBASE_APP_ID ? 'SET' : 'NOT SET');

console.log('Firebase config loaded:', {
  apiKey: firebaseConfig.apiKey ? '***' : 'missing',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId ? '***' : 'missing'
});

// Initialize Firebase
let app: any;
const existingApps = getApps();

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
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

console.log('All Firebase services initialized successfully');

// Export the initialized services
export { app, auth, db, storage };

// Initialize function for backward compatibility
async function initializeFirebase() {
  console.log('Firebase Web SDK initialized');
  return { app, auth, db, storage };
}

export { initializeFirebase }; 