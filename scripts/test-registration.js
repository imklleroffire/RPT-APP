const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, setDoc, serverTimestamp } = require('firebase/firestore');

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

async function testRegistration() {
  try {
    console.log('🧪 Testing Registration Process');
    console.log('==============================');
    console.log('');
    
    // Test data
    const testEmail = 'testpatient@gmail.com';
    const testPassword = 'testpassword123';
    const testName = 'Test Patient';
    const testRole = 'patient';
    
    console.log(`📧 Testing registration with:`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Name: ${testName}`);
    console.log(`   Role: ${testRole}`);
    console.log('');
    
    // Step 1: Create user account
    console.log('1️⃣ Creating user account...');
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    const user = userCredential.user;
    
    console.log('✅ User account created successfully!');
    console.log('   UID:', user.uid);
    console.log('   Email:', user.email);
    console.log('');
    
    // Step 2: Create user document with role
    console.log('2️⃣ Creating user document with role...');
    const userData = {
      id: user.uid,
      uid: user.uid,
      name: testName,
      email: testEmail,
      emailVerified: false,
      role: testRole,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(doc(db, 'users', user.uid), userData);
    console.log('✅ User document created successfully!');
    console.log('   Role set to:', testRole);
    console.log('');
    
    // Step 3: Verify the document was created correctly
    console.log('3️⃣ Verifying user document...');
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log('✅ User document verified:');
      console.log('   Name:', data.name);
      console.log('   Email:', data.email);
      console.log('   Role:', data.role);
      console.log('   Created at:', data.createdAt?.toDate());
      
      if (data.role === testRole) {
        console.log('   ✅ Role assignment is correct!');
      } else {
        console.log('   ❌ Role assignment is incorrect!');
        console.log('   Expected:', testRole);
        console.log('   Found:', data.role);
      }
    } else {
      console.log('❌ User document not found!');
    }
    
    console.log('');
    console.log('🎉 Registration test completed!');
    console.log('   The registration process should now work correctly.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('');
      console.log('📝 Email already exists. Testing sign in instead...');
      
      try {
        const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
        const user = userCredential.user;
        
        console.log('✅ Sign in successful!');
        console.log('   UID:', user.uid);
        
        // Check user document
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log('📊 Current user data:');
          console.log('   Name:', data.name);
          console.log('   Email:', data.email);
          console.log('   Role:', data.role);
        }
      } catch (signInError) {
        console.error('❌ Sign in error:', signInError);
      }
    }
  } finally {
    process.exit(0);
  }
}

testRegistration();
