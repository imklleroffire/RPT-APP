const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, sendEmailVerification } = require('firebase/auth');

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

async function resendVerificationTest() {
  try {
    console.log('🧪 Resend Verification Email Test');
    console.log('==================================');
    console.log('');
    
    // Get email from command line argument
    const args = process.argv.slice(2);
    const testEmail = args[0] || 'therapisttest@gmail.com';
    const testPassword = 'testpassword123';
    
    console.log(`📧 Testing with email: ${testEmail}`);
    console.log('');
    
    // Step 1: Sign in with existing account
    console.log('1️⃣ Signing in with existing account...');
    const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
    const user = userCredential.user;
    
    console.log('✅ Sign in successful!');
    console.log('   UID:', user.uid);
    console.log('   Email:', user.email);
    console.log('   Email Verified:', user.emailVerified);
    console.log('');
    
    // Step 2: Resend verification email
    console.log('2️⃣ Resending verification email...');
    try {
      await sendEmailVerification(user);
      console.log('✅ Verification email resent successfully!');
      console.log('📧 Email should arrive at:', testEmail);
      console.log('');
      
      console.log('📋 NEXT STEPS:');
      console.log('1. Check your email inbox');
      console.log('2. Check your spam/junk folder');
      console.log('3. Look for email from: noreply@rpt-appdemo2.firebaseapp.com');
      console.log('4. Click the verification link in the email');
      console.log('');
      
      console.log('🔍 IMPORTANT:');
      console.log('• If you still don\'t receive the email, check Firebase Console settings');
      console.log('• Make sure Email/Password authentication is enabled');
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
    
    if (error.code === 'auth/user-not-found') {
      console.log('💡 Solution: This email is not registered. Try creating a new account first.');
    } else if (error.code === 'auth/wrong-password') {
      console.log('💡 Solution: Incorrect password. Use the password: testpassword123');
    }
  }
}

// Run the test
resendVerificationTest(); 