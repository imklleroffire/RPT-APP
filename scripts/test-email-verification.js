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

async function testEmailVerification() {
  try {
    console.log('🧪 Testing email verification...');
    
    // Create a test user
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    console.log(`📧 Creating test user: ${testEmail}`);
    
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    const user = userCredential.user;
    
    console.log('✅ User created successfully:', user.uid);
    console.log('📧 User email:', user.email);
    console.log('🔍 Email verified:', user.emailVerified);
    
    // Try to send verification email
    console.log('📤 Attempting to send verification email...');
    
    try {
      await sendEmailVerification(user);
      console.log('✅ Email verification sent successfully!');
      console.log('📧 Check your email at:', testEmail);
    } catch (verificationError) {
      console.error('❌ Error sending verification email:', verificationError);
      console.error('Error code:', verificationError.code);
      console.error('Error message:', verificationError.message);
    }
    
    // Clean up - delete the test user
    console.log('🧹 Cleaning up test user...');
    await user.delete();
    console.log('✅ Test user deleted');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
}

// Run the test
testEmailVerification(); 