const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, collection, query, where, getDocs } = require('firebase/firestore');
const { format, subDays } = require('date-fns');

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

async function debugStreaks() {
  try {
    console.log('🔍 Debugging Streaks Data');
    console.log('========================');
    console.log('');
    
    // Get email from command line argument
    const args = process.argv.slice(2);
    const email = args[0];
    const password = args[1] || 'testpassword123';

    if (!email) {
      console.log('❌ Please provide an email address:');
      console.log('   node scripts/debug-streaks.js your-email@gmail.com [password]');
      return;
    }

    console.log(`📧 Debugging streaks for: ${email}`);
    console.log('');

    // Step 1: Sign in
    console.log('1️⃣ Signing in...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ Sign in successful!');
    console.log('   UID:', user.uid);
    console.log('');

    // Step 2: Check completedExercises collection
    console.log('2️⃣ Checking completedExercises collection...');
    const completedRef = doc(db, 'completedExercises', user.uid);
    const completedDoc = await getDoc(completedRef);

    if (completedDoc.exists()) {
      const data = completedDoc.data();
      const dateKeys = Object.keys(data);
      console.log('📊 Completed exercises data:');
      console.log('   Total date entries:', dateKeys.length);
      
      // Check yesterday specifically
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');
      
      console.log('   Yesterday:', yesterday);
      console.log('   Today:', today);
      
      if (data[yesterday]) {
        console.log('   ✅ Yesterday data found:');
        console.log('      Exercises:', data[yesterday].length);
        const completedCount = data[yesterday].filter(ex => ex.completed).length;
        console.log('      Completed:', completedCount);
        console.log('      Completion rate:', Math.round((completedCount / data[yesterday].length) * 100) + '%');
      } else {
        console.log('   ❌ No data for yesterday');
      }
      
      if (data[today]) {
        console.log('   ✅ Today data found:');
        console.log('      Exercises:', data[today].length);
        const completedCount = data[today].filter(ex => ex.completed).length;
        console.log('      Completed:', completedCount);
        console.log('      Completion rate:', Math.round((completedCount / data[today].length) * 100) + '%');
      } else {
        console.log('   ❌ No data for today');
      }
      
      // Show last 5 entries
      console.log('');
      console.log('📅 Last 5 date entries:');
      dateKeys.slice(-5).forEach(dateKey => {
        const exercises = data[dateKey];
        const completedCount = exercises.filter(ex => ex.completed).length;
        console.log(`   ${dateKey}: ${completedCount}/${exercises.length} (${Math.round((completedCount / exercises.length) * 100)}%)`);
      });
    } else {
      console.log('📝 No completed exercises document found');
    }

    // Step 3: Check streaks collection
    console.log('');
    console.log('3️⃣ Checking streaks collection...');
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

      if (data.streakHistory && data.streakHistory.length > 0) {
        console.log('');
        console.log('📅 Last 5 history entries:');
        data.streakHistory.slice(-5).forEach((entry, index) => {
          console.log(`   ${entry.date}: ${entry.totalCompleted}/${entry.totalAssigned} (${Math.round(entry.completionRate)}%) - ${entry.streakStatus}`);
        });
      }
    } else {
      console.log('📝 No streak document found');
    }

    // Step 4: Check bundles collection for assigned exercises
    console.log('');
    console.log('4️⃣ Checking assigned exercises...');
    const bundlesRef = collection(db, 'bundles');
    const bundlesQuery = query(bundlesRef, where('assignedPatients', 'array-contains', user.uid));
    const bundlesSnapshot = await getDocs(bundlesQuery);

    if (!bundlesSnapshot.empty) {
      console.log('📦 Assigned bundles found:', bundlesSnapshot.size);
      let totalAssignedExercises = 0;
      
      bundlesSnapshot.forEach(doc => {
        const bundleData = doc.data();
        const exercises = bundleData.exercises || [];
        totalAssignedExercises += exercises.length;
        console.log(`   Bundle "${bundleData.name}": ${exercises.length} exercises`);
      });
      
      console.log('   Total assigned exercises:', totalAssignedExercises);
    } else {
      console.log('📝 No assigned bundles found');
    }

    console.log('');
    console.log('🎉 Debug completed!');
    console.log('   Check the logs above to identify the issue.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

debugStreaks();
