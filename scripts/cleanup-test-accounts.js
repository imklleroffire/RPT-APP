const { initializeApp } = require('firebase/app');
const { getAuth, deleteUser } = require('firebase/auth');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

// Your Firebase config (copy from app/config/firebase.ts)
const firebaseConfig = {
  // Copy your config here from .env or firebase.ts
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function cleanupTestAccounts() {
  try {
    console.log('🔍 Fetching all users from Firestore...');
    
    // Get all users from Firestore
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = [];
    
    usersSnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`📊 Found ${users.length} users in database`);
    
    // Filter test accounts (you can modify this logic)
    const testEmails = [
      'test@test.com',
      'testpatient@gmail.com',
      'testtherapist@gmail.com',
      // Add more test emails here
    ];
    
    const testUsers = users.filter(user => 
      testEmails.some(testEmail => 
        user.email && user.email.toLowerCase().includes(testEmail.toLowerCase())
      )
    );
    
    console.log(`🧹 Found ${testUsers.length} test users to delete:`);
    testUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.id})`);
    });
    
    if (testUsers.length === 0) {
      console.log('✅ No test users found to delete');
      return;
    }
    
    // Confirm deletion
    console.log('\n⚠️  WARNING: This will permanently delete these accounts!');
    console.log('Type "DELETE" to confirm:');
    
    // For safety, we'll just show what would be deleted
    console.log('\n📝 To delete these accounts manually:');
    console.log('1. Go to Firebase Console > Authentication > Users');
    console.log('2. Delete each user listed above');
    console.log('3. Go to Firestore Database > Data > users collection');
    console.log('4. Delete the corresponding documents');
    
    console.log('\n🔗 Firebase Console Links:');
    console.log(`Authentication: https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/users`);
    console.log(`Firestore: https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/data`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Run the cleanup
cleanupTestAccounts(); 