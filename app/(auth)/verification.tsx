import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../config/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FONTS, SPACING } from '../constants/theme';

export default function VerificationScreen() {
  const router = useRouter();
  const { user, setPendingVerification, resendVerificationEmail } = useAuth();
  const { colors } = useTheme();
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResendVerification = async () => {
    try {
      console.log('[VERIFICATION] Resending verification email...');
      await resendVerificationEmail();
      setCountdown(60);
      setCanResend(false);
      Alert.alert('Success', 'Verification email sent! Check your inbox and spam folder.');
    } catch (error) {
      console.error('[VERIFICATION] Error resending verification:', error);
      // Error is already set in the context
    }
  };

  const checkVerificationStatus = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log('[VERIFICATION] Checking verification status...');
        console.log('[VERIFICATION] User:', currentUser.email);
        console.log('[VERIFICATION] Current verified status:', currentUser.emailVerified);
        
        // Reload the user to get the latest verification status
        await currentUser.reload();
        
        console.log('[VERIFICATION] After reload - verified status:', currentUser.emailVerified);
        
        if (currentUser.emailVerified) {
          console.log('[VERIFICATION] ✅ Email verified successfully!');
          Alert.alert('Success', 'Email verified! You can now sign in.');
          setPendingVerification(false);
          router.replace('/(auth)/login');
        } else {
          console.log('[VERIFICATION] ❌ Email not yet verified');
          Alert.alert(
            'Not Verified', 
            'Please check your email and click the verification link.\n\n' +
            'If you don\'t see the email, check your spam folder.\n\n' +
            'Email sent to: ' + currentUser.email
          );
        }
      } else {
        console.log('[VERIFICATION] No current user found');
        Alert.alert('Error', 'No user found. Please try signing up again.');
      }
    } catch (error) {
      console.error('[VERIFICATION] Error checking verification status:', error);
      Alert.alert('Error', 'Failed to check verification status. Please try again.');
    }
  };

  const handleBackToSignIn = async () => {
    try {
      // Sign out the user
      await auth.signOut();
      setPendingVerification(false);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setPendingVerification(false);
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <Card style={styles.card}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Verify Your Email
        </Text>
        <Text style={[styles.message, { color: colors.text.primary }]}>
          We've sent a verification email to {user?.email}. Please check your inbox and click the verification link.
        </Text>
        
        <TouchableOpacity
          onPress={handleResendVerification}
          disabled={!canResend}
          style={[
            styles.resendButton,
            { opacity: canResend ? 1 : 0.5 }
          ]}
        >
          <Text style={[styles.resendText, { color: colors.primary }]}>
            {canResend ? 'Resend Verification Email' : `Resend in ${countdown}s`}
          </Text>
        </TouchableOpacity>

        <Button
          onPress={checkVerificationStatus}
          style={styles.button}
          title="I've Verified My Email"
        />

        <Button
          onPress={handleResendVerification}
          style={styles.button}
          title="Resend Verification Email"
          variant="outline"
        />

        <Button
          onPress={handleBackToSignIn}
          style={styles.button}
          title="Back to Sign In"
          variant="outline"
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: SPACING.xl,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.xxl,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  message: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.md,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  resendButton: {
    marginBottom: SPACING.lg,
  },
  resendText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.md,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  button: {
    marginTop: SPACING.md,
  },
});
