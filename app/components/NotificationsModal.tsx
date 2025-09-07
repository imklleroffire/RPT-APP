import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationsModal({ visible, onClose }: NotificationsModalProps) {
  const { colors } = useTheme();
  const { notifications, markAsRead, unreadCount } = useNotifications();
  const { user, refreshUser } = useAuth();

  const handleAcceptInvite = async (notification: any) => {
    try {
      console.log('[NOTIFICATIONS] Accepting invite for notification:', notification.id);
      
      if (notification.type === 'patient_invite') {
        // Handle patient invitation acceptance
        const patientRef = doc(db, 'patients', notification.data?.patientId);
        await updateDoc(patientRef, {
          status: 'accepted',
          isAppUser: true,
          userId: user?.id,
          updatedAt: serverTimestamp(),
        });

        // Update patient's user document to link them to the therapist
        if (user?.id) {
          const userRef = doc(db, 'users', user.id);
          await updateDoc(userRef, {
            therapistId: notification.fromUserId,
            updatedAt: serverTimestamp(),
          });

          console.log('[NOTIFICATIONS] Updated patient user document with therapistId:', notification.fromUserId);
          
          // Force refresh the user data in AuthContext
          console.log('[NOTIFICATIONS] Refreshing user data...');
          const updatedUserDoc = await getDoc(userRef);
          if (updatedUserDoc.exists()) {
            const userData = updatedUserDoc.data();
            console.log('[NOTIFICATIONS] Updated user data:', userData);
          }
          
          // Refresh user data to get the updated therapistId
          await refreshUser();
          
          // Close the modal to force a refresh of the home screen
          onClose();
        }

        // Create acceptance notification for therapist
        const acceptanceNotification = {
          type: 'patient_accepted',
          fromUserId: user?.id,
          fromUserEmail: user?.email,
          fromUserName: user?.name,
          userId: notification.fromUserId,
          toEmail: notification.fromUserEmail,
          message: `${user?.name} has accepted your invitation to join your clinic.`,
          createdAt: serverTimestamp(),
          read: false,
          data: {
            patientId: notification.data?.patientId,
            patientEmail: user?.email,
            therapistId: notification.fromUserId,
            therapistName: notification.fromUserName,
          },
        };

        await addDoc(collection(db, 'notifications'), acceptanceNotification);
        Alert.alert('Success', 'You have successfully joined the clinic!');
      } else if (notification.type === 'clinic_invitation') {
        // Handle clinic invitation acceptance
        if (user?.id) {
          // Add therapist to clinic
          const clinicRef = doc(db, 'clinics', notification.clinicId);
          const clinicDoc = await getDoc(clinicRef);
          
          if (clinicDoc.exists()) {
            const clinicData = clinicDoc.data();
            const currentTherapists = clinicData.therapists || [];
            
            if (!currentTherapists.includes(user.id)) {
              await updateDoc(clinicRef, {
                therapists: [...currentTherapists, user.id],
                updatedAt: serverTimestamp(),
              });
            }
          }

          // Create acceptance notification for clinic owner
          const acceptanceNotification = {
            type: 'therapist_accepted',
            fromUserId: user?.id,
            fromUserEmail: user?.email,
            fromUserName: user?.name,
            userId: notification.fromUserId,
            toEmail: notification.fromUserEmail,
            message: `${user?.name} has accepted your invitation to join ${notification.clinicName}.`,
            createdAt: serverTimestamp(),
            read: false,
            data: {
              clinicId: notification.clinicId,
              clinicName: notification.clinicName,
              therapistId: user?.id,
              therapistName: user?.name,
            },
          };

          await addDoc(collection(db, 'notifications'), acceptanceNotification);
          Alert.alert('Success', `You have successfully joined ${notification.clinicName}!`);
        }
      }

      // Mark original notification as read
      await markAsRead(notification.id);
    } catch (error) {
      console.error('[NOTIFICATIONS] Error accepting invite:', error);
      Alert.alert('Error', 'Failed to accept invitation. Please try again.');
    }
  };

  const handleDenyInvite = async (notification: any) => {
    try {
      console.log('[NOTIFICATIONS] Denying invite for notification:', notification.id);
      
      if (notification.type === 'patient_invite') {
        // Handle patient invitation decline
        const patientRef = doc(db, 'patients', notification.data?.patientId);
        await updateDoc(patientRef, {
          status: 'declined',
          updatedAt: serverTimestamp(),
        });

        // Create decline notification for therapist
        const declineNotification = {
          type: 'patient_declined',
          fromUserId: user?.id,
          fromUserEmail: user?.email,
          fromUserName: user?.name,
          userId: notification.fromUserId,
          toEmail: notification.fromUserEmail,
          message: `${user?.name} has declined your invitation to join your clinic.`,
          createdAt: serverTimestamp(),
          read: false,
          data: {
            patientId: notification.data?.patientId,
            patientEmail: user?.email,
            therapistId: notification.fromUserId,
            therapistName: notification.fromUserName,
          },
        };

        await addDoc(collection(db, 'notifications'), declineNotification);
        Alert.alert('Declined', 'You have declined the invitation.');
      } else if (notification.type === 'clinic_invitation') {
        // Handle clinic invitation decline
        const declineNotification = {
          type: 'therapist_declined',
          fromUserId: user?.id,
          fromUserEmail: user?.email,
          fromUserName: user?.name,
          userId: notification.fromUserId,
          toEmail: notification.fromUserEmail,
          message: `${user?.name} has declined your invitation to join ${notification.clinicName}.`,
          createdAt: serverTimestamp(),
          read: false,
          data: {
            clinicId: notification.clinicId,
            clinicName: notification.clinicName,
            therapistId: user?.id,
            therapistName: user?.name,
          },
        };

        await addDoc(collection(db, 'notifications'), declineNotification);
        Alert.alert('Declined', `You have declined the invitation to join ${notification.clinicName}.`);
      }

      // Mark original notification as read
      await markAsRead(notification.id);
    } catch (error) {
      console.error('[NOTIFICATIONS] Error denying invite:', error);
      Alert.alert('Error', 'Failed to decline invitation. Please try again.');
    }
  };

  // Debug notifications in modal
  useEffect(() => {
    console.log('[NOTIFICATIONS_MODAL] Modal state:', {
      visible,
      notificationsCount: notifications.length,
      unreadCount,
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        message: n.message,
        read: n.read
      }))
    });
  }, [visible, notifications, unreadCount]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'patient_invite':
        return 'person-add';
      case 'bundle_assigned':
        return 'fitness';
      case 'therapist_invite':
        return 'medical';
      case 'therapist_added':
        return 'person';
      case 'clinic_invitation':
        return 'business';
      case 'therapist_accepted':
        return 'checkmark-circle';
      case 'patient_accepted':
        return 'checkmark-circle';
      default:
        return 'notifications';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.background.secondary }]}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: colors.text.primary }]}>
                Notifications
              </Text>
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {notifications.length === 0 ? (
              <Card variant="glow" style={styles.section}>
                <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                  No notifications yet
                </Text>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  variant={notification.read ? "glow" : "neon"} 
                  style={styles.notificationCard}
                >
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <View style={[styles.iconContainer, { backgroundColor: colors.background.primary }]}>
                        <Ionicons
                          name={getNotificationIcon(notification.type)}
                          size={24}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.textContainer}>
                        <Text style={[styles.fromUser, { color: colors.text.primary }]}>
                          {notification.fromUserName}
                        </Text>
                        <Text style={[styles.message, { color: colors.text.secondary }]}>
                          {notification.message}
                        </Text>
                        <Text style={[styles.time, { color: colors.text.secondary }]}>
                          {formatTime(notification.createdAt)}
                        </Text>
                      </View>
                      {!notification.read && (
                        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                      )}
                    </View>
                    
                    {/* Action buttons for patient_invite and clinic_invitation notifications */}
                    {(notification.type === 'patient_invite' || notification.type === 'clinic_invitation') && !notification.read && (
                      <View style={styles.actionButtons}>
                        <Button
                          title="Accept"
                          onPress={() => handleAcceptInvite(notification)}
                          variant="neon"
                          size="medium"
                          icon="checkmark"
                          style={styles.acceptButton}
                        />
                        <Button
                          title="Decline"
                          onPress={() => handleDenyInvite(notification)}
                          variant="outline"
                          size="medium"
                          icon="close"
                          style={styles.declineButton}
                        />
                      </View>
                    )}
                  </View>
                </Card>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: BORDER_RADIUS.xl,
    paddingTop: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  content: {
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  notificationCard: {
    marginBottom: SPACING.md,
  },
  notificationContent: {
    padding: SPACING.md,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  textContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  fromUser: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  message: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.xs,
  },
  time: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.regular,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: SPACING.sm,
    marginTop: SPACING.xs,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
    marginLeft: SPACING.sm,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.bold,
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: SPACING.sm,
  },
  acceptButton: {
    flex: 1,
  },
  declineButton: {
    flex: 1,
  },
}); 