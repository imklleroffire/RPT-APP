import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch, serverTimestamp, addDoc, getDocs } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { View, ActivityIndicator } from 'react-native';

interface Notification {
  id: string;
  type: 'patient_invite' | 'bundle_assigned' | 'therapist_added' | 'therapist_invite' | 'clinic_invitation' | 'therapist_accepted' | 'patient_accepted';
  fromUserId: string;
  fromUserEmail: string;
  fromUserName: string;
  message: string;
  createdAt: Date;
  read: boolean;
  userId?: string; // Recipient user ID
  toUserId?: string;
  toEmail?: string;
  clinicId?: string;
  clinicName?: string;
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
  createTestNotification: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      console.log('[NOTIFICATIONS] Setting up listener for user:', user.id);
      console.log('[NOTIFICATIONS] User email:', user.email);

      // Query ALL notifications and filter by userId field
      const allNotificationsQuery = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(allNotificationsQuery, snapshot => {
        console.log('[NOTIFICATIONS] ALL notifications in database:', snapshot.docs.length);
        
        // Filter notifications where userId matches the current user's ID
        const userNotifications = snapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
            } as Notification;
          })
          .filter(notification => notification.userId === user.id);

        console.log('[NOTIFICATIONS] Filtered notifications for user', user.id, ':', userNotifications.length);
        console.log('[NOTIFICATIONS] Notification details:', userNotifications.map(n => ({
          id: n.id,
          userId: n.userId,
          type: n.type,
          message: n.message,
          read: n.read
        })));

        setNotifications(userNotifications);
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
  }, [user?.id, user?.email]);

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

  const createTestNotification = async () => {
    if (!user?.id) {
      console.log('[NOTIFICATIONS] No user ID available for test notification');
      return;
    }
    
    try {
      console.log('[NOTIFICATIONS] Creating test notification for user:', user.id);
      console.log('[NOTIFICATIONS] Firebase db connection test:', {
        db: db ? 'connected' : 'not connected',
        user: user.id,
        email: user.email
      });

      // Test Firebase connection first
      const testDoc = await addDoc(collection(db, 'test'), {
        test: true,
        timestamp: serverTimestamp(),
      });
      console.log('[NOTIFICATIONS] Firebase connection test successful:', testDoc.id);

      // Test manual query to see existing notifications
      const manualQuery = query(
        collection(db, 'notifications'),
        where('toEmail', '==', user.email?.toLowerCase())
      );
      const manualSnapshot = await getDocs(manualQuery);
      console.log('[NOTIFICATIONS] Manual query results for email', user.email?.toLowerCase(), ':', manualSnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      })));

      const notificationRef = await addDoc(collection(db, 'notifications'), {
        type: 'patient_invite',
        fromUserId: user.id,
        fromUserEmail: user.email,
        fromUserName: user.name,
        userId: user.id, // This is the recipient ID
        toEmail: user.email.toLowerCase(),
        message: 'This is a test notification for the patient account to verify the notification system is working.',
        createdAt: serverTimestamp(),
        read: false,
        data: {
          therapistId: user.id,
          therapistName: user.name,
          therapistEmail: user.email,
        },
      });
      console.log('[NOTIFICATIONS] Test notification created successfully:', notificationRef.id);
    } catch (error) {
      console.error('[NOTIFICATIONS] Error creating test notification:', error);
      console.error('[NOTIFICATIONS] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof Error ? (error as any).code : 'Unknown code',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  console.log('[NOTIFICATIONS] Current state:', {
    notificationsCount: notifications.length,
    unreadCount,
    loading,
    userId: user?.id,
    userEmail: user?.email,
    notifications: notifications.map(n => ({
      id: n.id,
      type: n.type,
      message: n.message,
      toUserId: n.toUserId,
      toEmail: n.toEmail,
      read: n.read
    }))
  });

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        createTestNotification,
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