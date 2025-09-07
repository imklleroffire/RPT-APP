const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs } = require('firebase/firestore');

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

async function fixStreaksCollection() {
  try {
    console.log('🔧 Fix Streaks Collection Script');
    console.log('================================');
    console.log('');
    
    // Get email from command line argument
    const args = process.argv.slice(2);
    const email = args[0];
    const password = args[1] || 'testpassword123';
    
    if (!email) {
      console.log('❌ Please provide an email address:');
      console.log('   node scripts/fix-streaks-collection.js your-email@gmail.com [password]');
      return;
    }
    
    console.log(`📧 Fixing streaks for: ${email}`);
    console.log('');
    
    // Step 1: Sign in
    console.log('1️⃣ Signing in...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Sign in successful!');
    console.log('   UID:', user.uid);
    console.log('');
    
    // Step 2: Check current streaks collection
    console.log('2️⃣ Checking streaks collection...');
    const streaksRef = collection(db, 'streaks');
    const streaksSnapshot = await getDocs(streaksRef);
    
    console.log(`📊 Found ${streaksSnapshot.docs.length} documents in streaks collection`);
    
    // Step 3: Check user's streak document
    const userStreakRef = doc(db, 'streaks', user.uid);
    const userStreakDoc = await getDoc(userStreakRef);
    
    if (userStreakDoc.exists()) {
      const data = userStreakDoc.data();
      console.log('📈 Current streak data:');
      console.log('   Current streak:', data.currentStreak || 0);
      console.log('   Longest streak:', data.longestStreak || 0);
      console.log('   History entries:', data.streakHistory?.length || 0);
      
      // Check for spam entries (multiple entries in short time)
      if (data.streakHistory && data.streakHistory.length > 100) {
        console.log('⚠️  Detected potential spam entries!');
        console.log('   Cleaning up streak history...');
        
        // Keep only unique dates and limit to last 30 days
        const uniqueHistory = [];
        const seenDates = new Set();
        
        data.streakHistory
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date desc
          .slice(0, 30) // Keep only last 30 entries
          .forEach(entry => {
            if (!seenDates.has(entry.date)) {
              seenDates.add(entry.date);
              uniqueHistory.push(entry);
            }
          });
        
        // Recalculate streaks
        let currentStreak = 0;
        let longestStreak = 0;
        let lastActivityDate = null;
        
        uniqueHistory
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort by date asc
          .forEach(entry => {
            if (entry.streakStatus === 'maintained' || entry.streakStatus === 'started') {
              if (lastActivityDate) {
                const daysDiff = Math.floor((new Date(entry.date) - new Date(lastActivityDate)) / (1000 * 60 * 60 * 24));
                if (daysDiff === 1) {
                  currentStreak++;
                } else {
                  currentStreak = 1;
                }
              } else {
                currentStreak = 1;
              }
              longestStreak = Math.max(longestStreak, currentStreak);
              lastActivityDate = entry.date;
            } else if (entry.streakStatus === 'broken') {
              currentStreak = 0;
            }
          });
        
        // Update the document
        await setDoc(userStreakRef, {
          currentStreak,
          longestStreak,
          lastActivityDate: lastActivityDate ? new Date(lastActivityDate) : new Date(),
          totalDaysActive: uniqueHistory.filter(h => h.totalCompleted > 0).length,
          totalExercisesCompleted: uniqueHistory.reduce((sum, h) => sum + (h.totalCompleted || 0), 0),
          averageCompletionRate: uniqueHistory.length > 0 
            ? uniqueHistory.reduce((sum, h) => sum + (h.completionRate || 0), 0) / uniqueHistory.length 
            : 0,
          streakHistory: uniqueHistory,
          lastUpdated: new Date(),
        });
        
        console.log('✅ Streak data cleaned up!');
        console.log('   New current streak:', currentStreak);
        console.log('   New longest streak:', longestStreak);
        console.log('   Clean history entries:', uniqueHistory.length);
      } else {
        console.log('✅ Streak data looks good!');
      }
    } else {
      console.log('📝 No streak document found for user');
      console.log('   Creating initial streak document...');
      
      await setDoc(userStreakRef, {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date(),
        totalDaysActive: 0,
        totalExercisesCompleted: 0,
        averageCompletionRate: 0,
        streakHistory: [],
        lastUpdated: new Date(),
      });
      
      console.log('✅ Initial streak document created!');
    }
    
    console.log('');
    console.log('🎉 Streaks collection fix completed!');
    console.log('   The streaks system should now work properly.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixStreaksCollection();
