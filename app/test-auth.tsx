import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { auth } from './config/firebase';

export default function TestAuth() {
  useEffect(() => {
    console.log('TestAuth component mounted');
    console.log('Current Firebase auth state:', auth.currentUser);
    
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed in test component:', {
        hasUser: !!user,
        uid: user?.uid,
        email: user?.email
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Testing Firebase Auth</Text>
    </View>
  );
} 