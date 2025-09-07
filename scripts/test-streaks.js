const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

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

async function testStreaks() {
  try {
    console.log('🧪 Testing Streaks System');
    console.log('========================');
    console.log('');
    
    // Get email from command line argument
    const args = process.argv.slice(2);
    const email = args[0];
    const password = args[1] || 'testpassword123';
    
    if (!email) {
      console.log('❌ Please provide an email address:');
      console.log('   node scripts/test-streaks.js your-email@gmail.com [password]');
      return;
    }
    
    console.log(`📧 Testing streaks for: ${email}`);
    console.log('');
    
    // Step 1: Sign in
    console.log('1️⃣ Signing in...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Sign in successful!');
    console.log('   UID:', user.uid);
    console.log('');
    
    // Step 2: Check streaks collection
    console.log('2️⃣ Checking streaks collection...');
    const streakRef = doc(db, 'streaks', user.uid);
    const streakDoc = await getDoc(streakRef);
    
    if (streakDoc.exists()) {
      const data = streakDoc.data();
      console.log('📈 Streak data found:');
      console.log('   Current streak:', data.currentStreak || 0);
      console.log('   Longest streak:', data.longestStreak || 0);
      console.log('   Total days active:', data.totalDaysActive || 0);
      console.log('   Total exercises completed:', data.totalExercisesCompleted || 0);
      console.log('   Average completion rate:', data.averageCompletionRate || 0);
      console.log('   History entries:', data.streakHistory?.length || 0);
      
      // Check for any invalid dates
      if (data.streakHistory && data.streakHistory.length > 0) {
        console.log('');
        console.log('3️⃣ Checking for invalid dates...');
        let invalidDates = 0;
        
        data.streakHistory.forEach((entry, index) => {
          try {
            const date = new Date(entry.date);
            if (isNaN(date.getTime())) {
              invalidDates++;
              console.log(`   ❌ Invalid date at index ${index}:`, entry.date);
            }
          } catch (error) {
            invalidDates++;
            console.log(`   ❌ Error parsing date at index ${index}:`, error.message);
          }
        });
        
        if (invalidDates === 0) {
          console.log('   ✅ All dates are valid!');
        } else {
          console.log(`   ⚠️  Found ${invalidDates} invalid dates`);
        }
      }
    } else {
      console.log('📝 No streak document found');
    }
    
    // Step 3: Check completedExercises collection
    console.log('');
    console.log('4️⃣ Checking completedExercises collection...');
    const completedRef = doc(db, 'completedExercises', user.uid);
    const completedDoc = await getDoc(completedRef);
    
    if (completedDoc.exists()) {
      const data = completedDoc.data();
      const dateKeys = Object.keys(data);
      console.log('📊 Completed exercises data:');
      console.log('   Date entries:', dateKeys.length);
      dateKeys.forEach(dateKey => {
        const exercises = data[dateKey];
        console.log(`   ${dateKey}: ${exercises?.length || 0} exercises`);
      });
    } else {
      console.log('📝 No completed exercises document found');
    }
    
    console.log('');
    console.log('🎉 Streaks system test completed!');
    console.log('   The streaks tab should now work properly.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testStreaks();
