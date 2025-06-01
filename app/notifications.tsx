import React from 'react';
import { NotificationsModal } from './components/NotificationsModal';
import { useRouter } from 'expo-router';

export default function NotificationsScreen() {
  const router = useRouter();
  
  return (
    <NotificationsModal 
      visible={true} 
      onClose={() => router.back()} 
    />
  );
} 