import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { Card } from './ui/Card';
import { Ionicons } from '@expo/vector-icons';

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationsModal({ visible, onClose }: NotificationsModalProps) {
  const { colors } = useTheme();
  const { notifications, markAsRead } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'patient_invite':
        return 'person-add';
      case 'bundle_assigned':
        return 'fitness';
      case 'reminder':
        return 'alarm';
      default:
        return 'notifications';
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
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Notifications
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {notifications.length === 0 ? (
              <Card variant="glow" style={styles.section}>
                <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                  No new notifications
                </Text>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card key={notification.id} variant="glow" style={styles.notificationCard}>
                  <TouchableOpacity
                    style={styles.notificationContent}
                    onPress={() => !notification.read && markAsRead(notification.id)}
                  >
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
                          {notification.createdAt.toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    {!notification.read && (
                      <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                    )}
                  </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  notificationHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: SPACING.md,
  },
}); 