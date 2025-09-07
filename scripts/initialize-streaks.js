const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, Timestamp } = require('firebase/firestore');

// Firebase config
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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function initializeStreaks() {
  try {
    console.log('🚀 Initializing Streaks Data');
    console.log('==========================');
    console.log('');
    
    // Get email from command line argument
    const args = process.argv.slice(2);
    const email = args[0];
    const password = args[1] || 'testpassword123';

    if (!email) {
      console.log('❌ Please provide an email address:');
      console.log('   node scripts/initialize-streaks.js your-email@gmail.com [password]');
      return;
    }

    console.log(`📧 Initializing streaks for: ${email}`);
    console.log('');

    // Step 1: Sign in
    console.log('1️⃣ Signing in...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ Sign in successful!');
    console.log('   UID:', user.uid);
    console.log('');

    // Step 2: Initialize streaks document
    console.log('2️⃣ Initializing streaks document...');
    const streakRef = doc(db, 'streaks', user.uid);
    
    const initialStreakData = {
      userId: user.uid,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: Timestamp.fromDate(new Date()),
      totalDaysActive: 0,
      totalExercisesCompleted: 0,
      averageCompletionRate: 0,
      streakHistory: [],
      lastUpdated: Timestamp.fromDate(new Date())
    };

    await setDoc(streakRef, initialStreakData);
    console.log('✅ Streaks document initialized!');

    // Step 3: Initialize completed exercises document
    console.log('');
    console.log('3️⃣ Initializing completed exercises document...');
    const completedRef = doc(db, 'completedExercises', user.uid);
    
    const initialCompletedData = {
      // Empty object - will be populated as exercises are completed
    };

    await setDoc(completedRef, initialCompletedData);
    console.log('✅ Completed exercises document initialized!');

    console.log('');
    console.log('🎉 Streaks data initialization complete!');
    console.log('   The streaks tab should now work without errors.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

initializeStreaks();
