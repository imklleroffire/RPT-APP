const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'rpt-appdemo2'
  });
}

const db = admin.firestore();

async function fixUserRole() {
  try {
    console.log('🔧 Fix User Role Script (Admin SDK)');
    console.log('====================================');
    console.log('');
    
    // Get email from command line argument
    const args = process.argv.slice(2);
    const email = args[0];
    const newRole = args[1] || 'therapist';
    
    if (!email) {
      console.log('❌ Please provide an email address:');
      console.log('   node scripts/fix-user-role.js your-email@gmail.com [role]');
      return;
    }
    
    console.log(`📧 Fixing role for: ${email}`);
    console.log(`🎯 New role: ${newRole}`);
    console.log('');
    
    // Step 1: Find user by email
    console.log('1️⃣ Finding user by email...');
    const usersRef = db.collection('users');
    const query = usersRef.where('email', '==', email);
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      console.log('❌ No user found with that email address');
      return;
    }
    
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    
    console.log('✅ User found!');
    console.log('   UID:', userDoc.id);
    console.log('   Current role:', userData.role);
    console.log('   Name:', userData.name);
    console.log('');
    
    // Step 2: Update user role
    console.log('2️⃣ Updating user role...');
    await userDoc.ref.update({
      role: newRole,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('✅ User role updated successfully!');
    console.log(`   Changed from '${userData.role}' to '${newRole}'`);
    console.log('');
    console.log('🎉 Done! You can now sign in to the app and should see the correct role.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixUserRole();
