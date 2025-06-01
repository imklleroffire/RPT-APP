import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { showAlert } from '../utils/alerts';

interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  streakHistory: {
    date: Date;
    type: 'start' | 'continue' | 'break';
    completedBundles: string[];
  }[];
}

interface StreakModalProps {
  visible: boolean;
  onClose: () => void;
  streak: Streak;
}

export const StreakModal = ({ visible, onClose, streak }: StreakModalProps) => {
  const handleShare = () => {
    try {
      // Implement sharing functionality here
      showAlert('Success', 'Streak shared successfully!');
    } catch (error) {
      showAlert('Error', 'Failed to share streak. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Your Streak</Text>
          <View style={styles.streakInfo}>
            <View style={styles.streakItem}>
              <Text style={styles.streakLabel}>Current Streak</Text>
              <Text style={styles.streakValue}>{streak.currentStreak} days</Text>
            </View>
            <View style={styles.streakItem}>
              <Text style={styles.streakLabel}>Longest Streak</Text>
              <Text style={styles.streakValue}>{streak.longestStreak} days</Text>
            </View>
            <View style={styles.streakItem}>
              <Text style={styles.streakLabel}>Last Activity</Text>
              <Text style={styles.streakValue}>
                {streak.lastActivityDate.toLocaleDateString()}
              </Text>
            </View>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.shareButton]}
              onPress={handleShare}
            >
              <Text style={styles.buttonText}>Share Streak</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  streakInfo: {
    marginBottom: 20,
  },
  streakItem: {
    marginBottom: 15,
  },
  streakLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  streakValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    padding: 12,
    borderRadius: 5,
    minWidth: 120,
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: '#4CAF50',
  },
  closeButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 