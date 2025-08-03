import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { View, ActivityIndicator } from 'react-native';

interface Notification {
  id: string;
  type: 'patient_invite' | 'bundle_assigned' | 'therapist_added' | 'therapist_invite';
  fromUserId: string;
  fromUserEmail: string;
  fromUserName: string;
  message: string;
  createdAt: Date;
  read: boolean;
  toUserId?: string;
  toEmail?: string;
  data: {
    patientId?: string;
    patientEmail?: string;
    bundleId?: string;
    bundleName?: string;
    therapistId: string;
    therapistName: string;
    therapistEmail: string;
    clinicId?: string;
    clinicName?: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      console.log('[NOTIFICATIONS] Setting up listener for user:', user.id);
      
      // Query notifications for the current user
      const q = query(
        collection(db, 'notifications'),
        where('toUserId', '==', user.id),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, snapshot => {
        console.log('[NOTIFICATIONS] Received snapshot with', snapshot.docs.length, 'notifications');
        
        const notificationsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Notification[];

        console.log('[NOTIFICATIONS] Processed notifications:', notificationsList);
        setNotifications(notificationsList);
        setLoading(false);
      }, error => {
        console.error('[NOTIFICATIONS] Error fetching notifications:', error);
        setLoading(false);
      });

      return () => {
        console.log('[NOTIFICATIONS] Cleaning up listener');
        unsubscribe();
      };
    } else {
      console.log('[NOTIFICATIONS] No user or db available, clearing notifications');
      setNotifications([]);
      setLoading(false);
    }
  }, [user?.id]);

  const markAsRead = async (notificationId: string) => {
    try {
      console.log('[NOTIFICATIONS] Marking notification as read:', notificationId);
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[NOTIFICATIONS] Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (notifications.length === 0) return;
    
    try {
      console.log('[NOTIFICATIONS] Marking all notifications as read');
      const batch = writeBatch(db);
      notifications.forEach(notification => {
        if (!notification.read) {
          const notificationRef = doc(db, 'notifications', notification.id);
          batch.update(notificationRef, {
            read: true,
            updatedAt: serverTimestamp(),
          });
        }
      });
      await batch.commit();
    } catch (error) {
      console.error('[NOTIFICATIONS] Error marking all notifications as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  console.log('[NOTIFICATIONS] Current state:', {
    notificationsCount: notifications.length,
    unreadCount,
    loading,
    userId: user?.id
  });

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
} 