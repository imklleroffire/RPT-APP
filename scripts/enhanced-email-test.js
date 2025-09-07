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

async function enhancedEmailTest() {
  try {
    console.log('🧪 Enhanced Email Verification Test');
    console.log('=====================================');
    
    // Test 1: Basic verification
    console.log('\n📧 Test 1: Basic Email Verification');
    const testEmail1 = `test-basic-${Date.now()}@gmail.com`;
    const testPassword = 'testpassword123';
    
    console.log(`Creating user: ${testEmail1}`);
    const userCredential1 = await createUserWithEmailAndPassword(auth, testEmail1, testPassword);
    const user1 = userCredential1.user;
    
    console.log('✅ User created:', user1.uid);
    console.log('📧 Email:', user1.email);
    console.log('🔍 Verified:', user1.emailVerified);
    
    try {
      console.log('📤 Sending basic verification...');
      await sendEmailVerification(user1);
      console.log('✅ Basic verification sent!');
    } catch (error) {
      console.error('❌ Basic verification failed:', error.code, error.message);
    }
    
    // Test 2: With custom URL
    console.log('\n📧 Test 2: Custom URL Verification');
    const testEmail2 = `test-custom-${Date.now()}@gmail.com`;
    
    console.log(`Creating user: ${testEmail2}`);
    const userCredential2 = await createUserWithEmailAndPassword(auth, testEmail2, testPassword);
    const user2 = userCredential2.user;
    
    try {
      console.log('📤 Sending custom URL verification...');
      await sendEmailVerification(user2, {
        url: 'https://rpt-appdemo2.firebaseapp.com/__/auth/handler',
        handleCodeInApp: true
      });
      console.log('✅ Custom URL verification sent!');
    } catch (error) {
      console.error('❌ Custom URL verification failed:', error.code, error.message);
    }
    
    // Test 3: With action code settings
    console.log('\n📧 Test 3: Action Code Settings');
    const testEmail3 = `test-action-${Date.now()}@gmail.com`;
    
    console.log(`Creating user: ${testEmail3}`);
    const userCredential3 = await createUserWithEmailAndPassword(auth, testEmail3, testPassword);
    const user3 = userCredential3.user;
    
    try {
      console.log('📤 Sending action code verification...');
      await sendEmailVerification(user3, {
        url: 'https://rpt-appdemo2.firebaseapp.com/__/auth/handler',
        handleCodeInApp: true,
        iOS: {
          bundleId: 'com.rpt.app'
        },
        android: {
          packageName: 'com.rpt.app',
          installApp: true
        },
        dynamicLinkDomain: 'rpt-appdemo2.page.link'
      });
      console.log('✅ Action code verification sent!');
    } catch (error) {
      console.error('❌ Action code verification failed:', error.code, error.message);
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up test users...');
    try {
      await user1.delete();
      console.log('✅ User 1 deleted');
    } catch (e) {
      console.log('⚠️ Could not delete user 1 (might be verified)');
    }
    
    try {
      await user2.delete();
      console.log('✅ User 2 deleted');
    } catch (e) {
      console.log('⚠️ Could not delete user 2 (might be verified)');
    }
    
    try {
      await user3.delete();
      console.log('✅ User 3 deleted');
    } catch (e) {
      console.log('⚠️ Could not delete user 3 (might be verified)');
    }
    
    console.log('\n📋 Test Summary:');
    console.log('Check your Gmail accounts for verification emails');
    console.log('If no emails received, check:');
    console.log('1. Spam/Junk folder');
    console.log('2. Firebase Console > Authentication > Templates');
    console.log('3. Firebase Console > Authentication > Settings > Authorized domains');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
}

// Run the enhanced test
enhancedEmailTest(); 