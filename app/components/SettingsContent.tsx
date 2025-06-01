import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { showAlert } from '../utils/alerts';
import { THEME_OPTIONS } from '../context/ThemeContext';

type ThemeId = typeof THEME_OPTIONS[number]['id'];

interface SettingsContentProps {
  onClose?: () => void;
  showBackButton?: boolean;
}

export function SettingsContent({ onClose, showBackButton }: SettingsContentProps) {
  const router = useRouter();
  const { user, signOut, deleteAccount } = useAuth();
  const { colors, currentTheme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      showAlert('Error', 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    showAlert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Delete user data based on role
              if (user?.role === 'therapist') {
                await deleteDoc(doc(db, 'therapists', user.id));
              } else if (user?.role === 'patient') {
                await deleteDoc(doc(db, 'patients', user.id));
              }
              
              // Delete user authentication and account
              await deleteAccount();
              
              router.replace('/login');
            } catch (error) {
              console.error('Error deleting account:', error);
              showAlert('Error', 'Failed to delete account');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: colors.background.secondary }]}>
        {showBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Settings</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        <Card variant="glow" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Theme</Text>
          <View style={styles.themeOptions}>
            {THEME_OPTIONS.map((theme) => (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: currentTheme === theme.id ? colors.primary : colors.background.secondary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => setTheme(theme.id)}
              >
                <View style={[styles.themeIcon, { backgroundColor: colors.background.secondary }]}>
                  <Ionicons name={theme.icon} size={24} color={colors.primary} />
                </View>
                <Text style={[styles.themeName, { color: colors.text.primary }]}>
                  {theme.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card variant="glow" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Account</Text>
          <View style={styles.accountInfo}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>Email</Text>
            <Text style={[styles.value, { color: colors.text.primary }]}>{user?.email || 'Not available'}</Text>
            <Text style={[styles.label, { color: colors.text.secondary }]}>Role</Text>
            <Text style={[styles.value, { color: colors.text.primary }]}>
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Not available'}
            </Text>
          </View>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="outline"
            style={styles.button}
          />
          <Button
            title="Delete Account"
            onPress={handleDeleteAccount}
            variant="danger"
            style={styles.deleteButton}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    padding: SPACING.xs,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
  },
  content: {
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.lg,
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  themeOption: {
    width: '48%',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    marginBottom: SPACING.md,
  },
  themeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  themeName: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
  },
  accountInfo: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.xs,
  },
  value: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.md,
  },
  button: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  deleteButton: {
    marginTop: SPACING.sm,
  },
}); 