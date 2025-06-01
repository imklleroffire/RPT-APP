import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  condition?: string;
  isAppUser: boolean;
}

export default function TherapistHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user?.uid) return;

    const patientsRef = collection(db, 'patients');
    const q = query(patientsRef, where('therapistId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const patientList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Patient[];
      setPatients(patientList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderPatientCard = ({ item }: { item: Patient }) => (
    <Card variant="neon" style={styles.patientCard}>
      <View style={styles.patientHeader}>
        <Text style={[styles.patientName, { color: colors.text.primary }]}>
          {item.name}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.isAppUser ? colors.success : colors.warning }
        ]}>
          <Text style={styles.statusText}>
            {item.isAppUser ? 'Active' : 'Pending'}
          </Text>
        </View>
      </View>

      <View style={styles.patientInfo}>
        <Text style={[styles.infoText, { color: colors.text.secondary }]}>
          {item.email}
        </Text>
        <Text style={[styles.infoText, { color: colors.text.secondary }]}>
          {item.phone}
        </Text>
        {item.condition && (
          <Text style={[styles.infoText, { color: colors.text.secondary }]}>
            Condition: {item.condition}
          </Text>
        )}
      </View>

      <Button
        title="View Details"
        onPress={() => router.push(`/patient-detail/${item.id}`)}
        variant="neon"
        size="small"
        style={styles.viewButton}
      />
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          My Patients
        </Text>
        <Button
          title="Add Patient"
          onPress={() => router.push('/add-patient')}
          variant="neon"
          size="small"
          style={styles.addButton}
        />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.text.secondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text.primary }]}
          placeholder="Search patients..."
          placeholderTextColor={colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredPatients}
        renderItem={renderPatientCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
  },
  addButton: {
    minWidth: 120,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontFamily: FONTS.regular,
  },
  listContainer: {
    padding: SPACING.lg,
  },
  patientCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  patientName: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  statusText: {
    color: '#fff',
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.sm,
  },
  patientInfo: {
    marginBottom: SPACING.md,
  },
  infoText: {
    fontSize: FONTS.sizes.md,
    marginBottom: SPACING.xs,
  },
  viewButton: {
    alignSelf: 'flex-end',
  },
}); 