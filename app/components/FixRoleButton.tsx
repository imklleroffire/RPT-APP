import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function FixRoleButton() {
  const { user } = useAuth();

  const fixUserRole = async () => {
    if (!user) {
      Alert.alert('Error', 'No user logged in');
      return;
    }

    try {
      Alert.alert(
        'Fix User Role',
        `Current role: ${user.role}\n\nDo you want to change it to 'therapist'?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Fix to Therapist',
            onPress: async () => {
              try {
                await updateDoc(doc(db, 'users', user.uid), {
                  role: 'therapist',
                  updatedAt: serverTimestamp(),
                });
                Alert.alert('Success', 'Role updated to therapist! Please restart the app.');
              } catch (error) {
                console.error('Error updating role:', error);
                Alert.alert('Error', 'Failed to update role. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Something went wrong');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.currentRole}>Current Role: {user?.role || 'Unknown'}</Text>
      <TouchableOpacity style={styles.button} onPress={fixUserRole}>
        <Text style={styles.buttonText}>Fix Role to Therapist</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  currentRole: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
