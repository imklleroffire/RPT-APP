const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, setDoc, collection, getDocs } = require('firebase/firestore');

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

// Helper function to safely parse dates
function safeParseDate(timestamp) {
  try {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    if (timestamp && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    if (timestamp && typeof timestamp === 'string') {
      const parsed = new Date(timestamp);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    if (timestamp instanceof Date) {
      return timestamp;
    }
    return null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}

// Helper function to validate date string
function isValidDateString(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

async function fixInvalidDates() {
  try {
    console.log('🔧 Fixing Invalid Dates in Streaks Collection');
    console.log('============================================');
    console.log('');
    
    // Get email from command line argument
    const args = process.argv.slice(2);
    const email = args[0];
    const password = args[1] || 'testpassword123';

    if (!email) {
      console.log('❌ Please provide an email address:');
      console.log('   node scripts/fix-invalid-dates.js your-email@gmail.com [password]');
      return;
    }

    console.log(`📧 Fixing dates for: ${email}`);
    console.log('');

    // Step 1: Sign in
    console.log('1️⃣ Signing in...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ Sign in successful!');
    console.log('   UID:', user.uid);
    console.log('');

    // Step 2: Get streaks document
    console.log('2️⃣ Checking streaks document...');
    const streakRef = doc(db, 'streaks', user.uid);
    const streakDoc = await getDoc(streakRef);

    if (!streakDoc.exists()) {
      console.log('📝 No streaks document found. Creating one...');
      const initialStreakData = {
        userId: user.uid,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date(),
        totalDaysActive: 0,
        totalExercisesCompleted: 0,
        averageCompletionRate: 0,
        streakHistory: [],
        lastUpdated: new Date(),
      };
      
      await setDoc(streakRef, initialStreakData);
      console.log('✅ Created initial streaks document');
      return;
    }

    const data = streakDoc.data();
    console.log('📊 Current streak data:');
    console.log('   Current streak:', data.currentStreak || 0);
    console.log('   Longest streak:', data.longestStreak || 0);
    console.log('   History entries:', data.streakHistory?.length || 0);
    console.log('');

    // Step 3: Check for invalid dates
    console.log('3️⃣ Checking for invalid dates...');
    let invalidDatesFound = 0;
    let fixedHistory = [];

    if (data.streakHistory && Array.isArray(data.streakHistory)) {
      data.streakHistory.forEach((entry, index) => {
        try {
          // Check if entry has required fields
          if (!entry || typeof entry !== 'object') {
            console.log(`   ❌ Invalid entry at index ${index}:`, entry);
            invalidDatesFound++;
            return;
          }

          // Check date field
          let validDate = false;
          let fixedDate = null;

          if (entry.date) {
            // Try to parse the date
            const parsedDate = safeParseDate(entry.date);
            if (parsedDate) {
              validDate = true;
              fixedDate = parsedDate;
            } else if (isValidDateString(entry.date)) {
              validDate = true;
              fixedDate = new Date(entry.date);
            }
          }

          if (!validDate) {
            console.log(`   ❌ Invalid date at index ${index}:`, entry.date);
            invalidDatesFound++;
            
            // Create a valid entry with today's date as fallback
            const fallbackEntry = {
              ...entry,
              date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
              streakStatus: entry.streakStatus || 'none',
              totalAssigned: entry.totalAssigned || 0,
              totalCompleted: entry.totalCompleted || 0,
              completionRate: entry.completionRate || 0,
              allExercisesCompleted: entry.allExercisesCompleted || false,
              exercises: entry.exercises || []
            };
            fixedHistory.push(fallbackEntry);
          } else {
            // Create a valid entry with the fixed date
            const validEntry = {
              ...entry,
              date: fixedDate.toISOString().split('T')[0], // Ensure YYYY-MM-DD format
              streakStatus: entry.streakStatus || 'none',
              totalAssigned: entry.totalAssigned || 0,
              totalCompleted: entry.totalCompleted || 0,
              completionRate: entry.completionRate || 0,
              allExercisesCompleted: entry.allExercisesCompleted || false,
              exercises: entry.exercises || []
            };
            fixedHistory.push(validEntry);
          }
        } catch (error) {
          console.log(`   ❌ Error processing entry at index ${index}:`, error.message);
          invalidDatesFound++;
        }
      });
    }

    if (invalidDatesFound === 0) {
      console.log('   ✅ All dates are valid!');
    } else {
      console.log(`   ⚠️  Found ${invalidDatesFound} invalid dates`);
      console.log('');

      // Step 4: Fix the document
      console.log('4️⃣ Fixing streaks document...');
      
      // Sort history by date
      fixedHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Remove duplicates based on date
      const uniqueHistory = fixedHistory.filter((entry, index, self) => 
        index === self.findIndex(e => e.date === entry.date)
      );

      const fixedStreakData = {
        ...data,
        streakHistory: uniqueHistory,
        lastUpdated: new Date()
      };

      await setDoc(streakRef, fixedStreakData);
      console.log('✅ Fixed streaks document!');
      console.log('   History entries after fix:', uniqueHistory.length);
    }

    console.log('');
    console.log('🎉 Invalid dates fix completed!');
    console.log('   The calendar should now work properly.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixInvalidDates();
