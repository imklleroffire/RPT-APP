import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../../firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { COLORS, FONTS, SPACING } from '../constants/theme';

export default function VerificationScreen() {
  const router = useRouter();
  const { user, setPendingVerification } = useAuth();
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
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setCountdown(60);
        setCanResend(false);
        Alert.alert('Success', 'Verification email sent!');
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      Alert.alert('Error', 'Failed to send verification email');
    }
  };

  const handleBackToSignIn = () => {
    setPendingVerification(false);
    router.replace('/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Card style={styles.card}>
        <Text style={[styles.title, { color: colors.text }]}>
          Verify Your Email
        </Text>
        <Text style={[styles.message, { color: colors.text }]}>
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
          onPress={handleBackToSignIn}
          style={styles.button}
          title="Back to Sign In"
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
