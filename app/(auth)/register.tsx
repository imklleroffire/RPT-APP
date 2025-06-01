import React, { useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';

export default function RegisterScreen() {
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [role, setRole] = useState<'patient' | 'therapist'>('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { signUp } = useAuth();
  const { colors } = useTheme();
  const glowAnim = new Animated.Value(0);
  const pulseAnim = new Animated.Value(0);

  React.useEffect(() => {
    const startGlowAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startGlowAnimation();
  }, []);

  const handleRoleSelect = (selectedRole: 'patient' | 'therapist') => {
    setRole(selectedRole);
    setStep('details');
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const success = await signUp(email, password, name, role);
      if (success) {
        router.replace('/verification');
      }
    } catch (err) {
      // Error is already handled in AuthContext
      console.log('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.glowContainer,
            {
              opacity: glowOpacity,
              transform: [{ scale: pulseScale }],
            },
          ]}
        >
          <View style={[styles.glow, { backgroundColor: colors.primary }]} />
          <View style={[styles.glowSecondary, { backgroundColor: colors.secondary }]} />
        </Animated.View>

        <Card variant="glow" style={styles.card}>
          {step === 'role' ? (
            <>
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text.primary }]}>Choose Your Role</Text>
                <Text style={[styles.subtitle, { color: colors.text.secondary }]}>Select how you'll use the app</Text>
              </View>

              <View style={styles.roleContainer}>
                <Button
                  title="I'm a Patient"
                  onPress={() => handleRoleSelect('patient')}
                  variant="primary"
                  size="large"
                  style={styles.roleButton}
                />

                <Button
                  title="I'm a Therapist"
                  onPress={() => handleRoleSelect('therapist')}
                  variant="secondary"
                  size="large"
                  style={styles.roleButton}
                />

                <Button
                  title="Back to Sign In"
                  onPress={() => router.push('/login')}
                  variant="outline"
                  size="large"
                  style={styles.roleButton}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text.primary }]}>
                  Create {role === 'therapist' ? 'Therapist' : 'Patient'} Account
                </Text>
                <Text style={[styles.subtitle, { color: colors.text.secondary }]}>Join our community</Text>
              </View>

              <Input
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                autoCapitalize="words"
                error={error && !name ? 'Name is required' : undefined}
              />

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                error={error && !email ? 'Email is required' : undefined}
              />

              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                secureTextEntry
                error={error && !password ? 'Password is required' : undefined}
              />

              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                secureTextEntry
                error={error && !confirmPassword ? 'Please confirm your password' : undefined}
              />

              {error && (
                <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                </View>
              )}

              <View style={styles.buttonContainer}>
                <Button
                  title={loading ? 'Creating Account...' : 'Create Account'}
                  onPress={handleRegister}
                  disabled={loading}
                  variant="primary"
                  size="large"
                  style={styles.button}
                />

                <Button
                  title="Back to Role Selection"
                  onPress={() => setStep('role')}
                  variant="outline"
                  size="large"
                  style={styles.button}
                />
              </View>
            </>
          )}
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  glowContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.1,
  },
  glowSecondary: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.1,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.xxl,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.lg,
  },
  roleContainer: {
    gap: SPACING.md,
  },
  roleButton: {
    width: '100%',
  },
  errorContainer: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.lg,
  },
  errorText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.sm,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: SPACING.md,
  },
  button: {
    width: '100%',
  },
}); 