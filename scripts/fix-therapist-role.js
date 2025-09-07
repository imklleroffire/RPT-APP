const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, updateDoc, serverTimestamp } = require('firebase/firestore');

// Firebase config (same as your app)
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

async function fixTherapistRole() {
  try {
    console.log('🔧 Fix Therapist Role Script');
    console.log('============================');
    console.log('');
    
    // Get email from command line argument
    const args = process.argv.slice(2);
    const email = args[0];
    const password = args[1] || 'testpassword123';
    
    if (!email) {
      console.log('❌ Please provide an email address:');
      console.log('   node scripts/fix-therapist-role.js your-email@gmail.com [password]');
      return;
    }
    
    console.log(`📧 Fixing role for: ${email}`);
    console.log('');
    
    // Step 1: Sign in
    console.log('1️⃣ Signing in...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Sign in successful!');
    console.log('   UID:', user.uid);
    console.log('   Email:', user.email);
    console.log('');
    
    // Step 2: Update user role to therapist
    console.log('2️⃣ Updating user role to therapist...');
    await updateDoc(doc(db, 'users', user.uid), {
      role: 'therapist',
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ User role updated to therapist!');
    console.log('');
    
    console.log('🎉 Success! Your account is now set as a therapist.');
    console.log('   You can now sign in to the app and should see the therapist interface.');
    console.log('');
    
    console.log('📋 Next Steps:');
    console.log('1. Sign out of this script');
    console.log('2. Open your app');
    console.log('3. Sign in with the same email');
    console.log('4. You should now see the therapist interface');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      console.log('💡 Solution: This email is not registered. Please sign up first.');
    } else if (error.code === 'auth/wrong-password') {
      console.log('💡 Solution: Incorrect password. Please provide the correct password.');
    } else if (error.code === 'auth/invalid-email') {
      console.log('💡 Solution: Please provide a valid email address.');
    }
  }
}

// Run the script
fixTherapistRole(); 