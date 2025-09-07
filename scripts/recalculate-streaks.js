const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, Timestamp } = require('firebase/firestore');
const { format, isSameDay } = require('date-fns');

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

async function recalculateStreaks() {
  try {
    console.log('🔄 Recalculating Streaks Data');
    console.log('============================');
    console.log('');
    
    // Get email from command line argument
    const args = process.argv.slice(2);
    const email = args[0];
    const password = args[1] || 'testpassword123';

    if (!email) {
      console.log('❌ Please provide an email address:');
      console.log('   node scripts/recalculate-streaks.js your-email@gmail.com [password]');
      return;
    }

    console.log(`📧 Recalculating streaks for: ${email}`);
    console.log('');

    // Step 1: Sign in
    console.log('1️⃣ Signing in...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ Sign in successful!');
    console.log('   UID:', user.uid);
    console.log('');

    // Step 2: Get assigned exercises
    console.log('2️⃣ Getting assigned exercises...');
    const bundlesRef = collection(db, 'bundles');
    const bundlesQuery = query(bundlesRef, where('assignedPatients', 'array-contains', user.uid));
    const bundlesSnapshot = await getDocs(bundlesQuery);

    const assignedExercises = [];
    if (!bundlesSnapshot.empty) {
      console.log('📦 Found bundles:', bundlesSnapshot.size);
      
      bundlesSnapshot.forEach(doc => {
        const bundleData = doc.data();
        const exercises = bundleData.exercises || [];
        console.log(`   Bundle "${bundleData.name}": ${exercises.length} exercises`);
        
        exercises.forEach((exercise) => {
          assignedExercises.push({
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            bundleId: doc.id,
            bundleName: bundleData.name,
            completedAt: new Date(),
            completed: false
          });
        });
      });
      
      console.log('   Total assigned exercises:', assignedExercises.length);
    } else {
      console.log('📝 No assigned bundles found');
    }

    // Step 3: Get completed exercises data
    console.log('');
    console.log('3️⃣ Getting completed exercises data...');
    const completedRef = doc(db, 'completedExercises', user.uid);
    const completedDoc = await getDoc(completedRef);

    if (!completedDoc.exists()) {
      console.log('📝 No completed exercises document found');
      return;
    }

    const allCompletedData = completedDoc.data();
    const sortedDates = Object.keys(allCompletedData).sort();
    console.log('📅 Found completed exercises for dates:', sortedDates);

    // Step 4: Recalculate streak data
    console.log('');
    console.log('4️⃣ Recalculating streak data...');
    
    const streakData = {
      userId: user.uid,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: new Date(),
      totalDaysActive: 0,
      totalExercisesCompleted: 0,
      averageCompletionRate: 0,
      streakHistory: [],
      lastUpdated: new Date()
    };

    let currentStreak = 0;
    let longestStreak = 0;
    let lastActivityDate = new Date(0);

    for (const dateStr of sortedDates) {
      const completedExercises = allCompletedData[dateStr];
      const totalAssigned = assignedExercises.length;
      const totalCompleted = completedExercises.filter(ex => ex.completed).length;
      const completionRate = totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0;
      const allExercisesCompleted = totalCompleted === totalAssigned && totalAssigned > 0;

      console.log(`   ${dateStr}: ${totalCompleted}/${totalAssigned} (${Math.round(completionRate)}%) - ${allExercisesCompleted ? 'COMPLETE' : 'INCOMPLETE'}`);

      const dailyCompletion = {
        date: dateStr,
        exercises: completedExercises.map(ex => ({
          ...ex,
          completedAt: ex.completedAt?.toDate() || new Date()
        })),
        totalAssigned,
        totalCompleted,
        completionRate,
        streakStatus: 'none',
        allExercisesCompleted
      };

      // Determine streak status
      const currentDate = new Date(dateStr);
      const previousDate = new Date(lastActivityDate);
      previousDate.setDate(previousDate.getDate() + 1);

      if (allExercisesCompleted) {
        if (isSameDay(previousDate, currentDate)) {
          // Continue streak
          currentStreak += 1;
          dailyCompletion.streakStatus = 'maintained';
        } else {
          // Start new streak
          currentStreak = 1;
          dailyCompletion.streakStatus = 'started';
        }
        lastActivityDate = currentDate;
      } else if (currentStreak > 0 && isSameDay(previousDate, currentDate)) {
        // Break streak
        currentStreak = 0;
        dailyCompletion.streakStatus = 'broken';
      }

      longestStreak = Math.max(currentStreak, longestStreak);
      streakData.streakHistory.push(dailyCompletion);
    }

    // Update final streak data
    streakData.currentStreak = currentStreak;
    streakData.longestStreak = longestStreak;
    streakData.lastActivityDate = lastActivityDate;

    // Calculate additional stats
    const activeDays = streakData.streakHistory.filter(h => h.totalCompleted > 0).length;
    const totalExercises = streakData.streakHistory.reduce((sum, h) => sum + h.totalCompleted, 0);
    const avgCompletion = streakData.streakHistory.length > 0 
      ? streakData.streakHistory.reduce((sum, h) => sum + h.completionRate, 0) / streakData.streakHistory.length 
      : 0;

    streakData.totalDaysActive = activeDays;
    streakData.totalExercisesCompleted = totalExercises;
    streakData.averageCompletionRate = avgCompletion;

    // Step 5: Save to Firestore
    console.log('');
    console.log('5️⃣ Saving recalculated streak data...');
    const streakRef = doc(db, 'streaks', user.uid);
    await setDoc(streakRef, {
      ...streakData,
      lastActivityDate: Timestamp.fromDate(streakData.lastActivityDate),
      lastUpdated: Timestamp.fromDate(streakData.lastUpdated),
      streakHistory: streakData.streakHistory.map(h => ({
        ...h,
        exercises: h.exercises.map(ex => ({
          ...ex,
          completedAt: Timestamp.fromDate(ex.completedAt)
        }))
      }))
    });

    console.log('✅ Streak recalculation complete!');
    console.log('');
    console.log('📊 Final Results:');
    console.log('   Current streak:', currentStreak);
    console.log('   Longest streak:', longestStreak);
    console.log('   Total days active:', activeDays);
    console.log('   Total exercises completed:', totalExercises);
    console.log('   Average completion rate:', Math.round(avgCompletion) + '%');
    console.log('   History entries:', streakData.streakHistory.length);

    console.log('');
    console.log('🎉 The calendar should now show the correct data!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

recalculateStreaks();
