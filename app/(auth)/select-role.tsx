import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Logo from '../components/Logo';

export default function SelectRoleScreen() {
  const router = useRouter();

  const handleRoleSelect = (role: 'patient' | 'therapist') => {
    router.push(`/register?role=${role}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Logo size={100} />
        <Text style={styles.title}>Choose Your Role</Text>
        <Text style={styles.subtitle}>Select how you'll use the app</Text>
      </View>

      <View style={styles.options}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => handleRoleSelect('patient')}
        >
          <Text style={styles.optionTitle}>Patient</Text>
          <Text style={styles.optionDescription}>
            Track your exercises and streaks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => handleRoleSelect('therapist')}
        >
          <Text style={styles.optionTitle}>Therapist</Text>
          <Text style={styles.optionDescription}>
            Manage patients and push exercise bundles
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  options: {
    width: '100%',
  },
  optionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 16,
    color: '#666',
  },
}); 