const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, sendEmailVerification } = require('firebase/auth');

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

async function realEmailTest() {
  try {
    console.log('🧪 Real Email Verification Test');
    console.log('================================');
    console.log('');
    console.log('📋 IMPORTANT: Use a REAL Gmail address you can access!');
    console.log('');
    
    // Use a real email address - replace with your actual email
    const realEmail = 'therapisttest@gmail.com'; // User provided email
    const testPassword = 'testpassword123';
    
    console.log(`📧 Testing with email: ${realEmail}`);
    console.log('');
    
    // Step 1: Create user
    console.log('1️⃣ Creating user account...');
    const userCredential = await createUserWithEmailAndPassword(auth, realEmail, testPassword);
    const user = userCredential.user;
    
    console.log('✅ User created successfully!');
    console.log('   UID:', user.uid);
    console.log('   Email:', user.email);
    console.log('   Email Verified:', user.emailVerified);
    console.log('');
    
    // Step 2: Send verification email
    console.log('2️⃣ Sending verification email...');
    try {
      await sendEmailVerification(user);
      console.log('✅ Verification email sent successfully!');
      console.log('📧 Email should arrive at:', realEmail);
      console.log('');
      
      console.log('📋 NEXT STEPS:');
      console.log('1. Check your email inbox');
      console.log('2. Check your spam/junk folder');
      console.log('3. Look for email from: noreply@rpt-appdemo2.firebaseapp.com');
      console.log('4. Click the verification link in the email');
      console.log('');
      
      console.log('🔍 TROUBLESHOOTING:');
      console.log('• If no email received, check Firebase Console > Authentication > Users');
      console.log('• Verify your email address is correct');
      console.log('• Check if your email provider is blocking Firebase emails');
      console.log('• Try adding noreply@rpt-appdemo2.firebaseapp.com to your contacts');
      console.log('');
      
      console.log('🔗 Firebase Console Links:');
      console.log('Users: https://console.firebase.google.com/project/rpt-appdemo2/authentication/users');
      console.log('Templates: https://console.firebase.google.com/project/rpt-appdemo2/authentication/templates');
      console.log('Settings: https://console.firebase.google.com/project/rpt-appdemo2/authentication/settings');
      
    } catch (verificationError) {
      console.error('❌ Verification email failed:');
      console.error('   Error Code:', verificationError.code);
      console.error('   Error Message:', verificationError.message);
      console.log('');
      
      if (verificationError.code === 'auth/too-many-requests') {
        console.log('💡 Solution: Wait a few minutes before trying again');
      } else if (verificationError.code === 'auth/invalid-email') {
        console.log('💡 Solution: Use a valid email address');
      } else if (verificationError.code === 'auth/requires-recent-login') {
        console.log('💡 Solution: User needs to sign in recently');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('💡 Solution: This email is already registered. Try signing in instead.');
    } else if (error.code === 'auth/weak-password') {
      console.log('💡 Solution: Use a stronger password (at least 6 characters)');
    }
  }
}

// Check if user provided a real email
const args = process.argv.slice(2);
if (args.length > 0) {
  // Replace the email in the script with the provided email
  const scriptContent = require('fs').readFileSync(__filename, 'utf8');
  const updatedScript = scriptContent.replace(
    "const realEmail = 'your-real-email@gmail.com'; // REPLACE THIS WITH YOUR EMAIL",
    `const realEmail = '${args[0]}'; // User provided email`
  );
  require('fs').writeFileSync(__filename, updatedScript);
  console.log(`📧 Updated test script to use: ${args[0]}`);
}

// Run the test
realEmailTest(); 