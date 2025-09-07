const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, sendEmailVerification, onAuthStateChanged } = require('firebase/auth');

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

async function correctFirebaseV9Test() {
  try {
    console.log('🧪 Correct Firebase Web SDK v9+ Email Verification Test');
    console.log('========================================================');
    
    // Test 1: Create user and send verification
    console.log('\n📧 Test 1: Create User and Send Verification');
    const testEmail = `test-v9-${Date.now()}@gmail.com`;
    const testPassword = 'testpassword123';
    
    console.log(`Creating user: ${testEmail}`);
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    const user = userCredential.user;
    
    console.log('✅ User created:', user.uid);
    console.log('📧 Email:', user.email);
    console.log('🔍 Verified:', user.emailVerified);
    
    // Send verification email using correct v9+ approach
    try {
      console.log('📤 Sending email verification (v9+ approach)...');
      await sendEmailVerification(user);
      console.log('✅ Email verification sent successfully!');
      console.log('📧 Check your email at:', testEmail);
    } catch (error) {
      console.error('❌ Email verification failed:', error.code, error.message);
    }
    
    // Test 2: Auth state listener to check verification
    console.log('\n📧 Test 2: Auth State Listener Check');
    
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
          console.log('🔍 Auth state changed - User:', currentUser.email);
          console.log('🔍 Email verified:', currentUser.emailVerified);
          
          if (currentUser.emailVerified) {
            console.log('✅ Email is verified!');
          } else {
            console.log('❌ Email is not verified');
          }
          
          unsubscribe();
          resolve();
        }
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        console.log('⏰ Timeout reached');
        unsubscribe();
        resolve();
      }, 10000);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
}

// Run the test
correctFirebaseV9Test().then(() => {
  console.log('\n📋 Test Summary:');
  console.log('1. Check your Gmail for verification email');
  console.log('2. Click the verification link in the email');
  console.log('3. The auth state listener should detect the verification');
  console.log('4. Check spam folder if email not received');
  
  console.log('\n🔗 Firebase Console Links:');
  console.log('Authentication: https://console.firebase.google.com/project/rpt-appdemo2/authentication/users');
  console.log('Templates: https://console.firebase.google.com/project/rpt-appdemo2/authentication/templates');
}); 