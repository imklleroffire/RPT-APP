import React, { useState } from 'react';
import { View, Text, StyleSheet, Animated, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { FONTS, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, error: authError } = useAuth();
  const { colors } = useTheme();
  const glowAnim = new Animated.Value(0);

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
    };

    startGlowAnimation();
  }, []);

  const validateForm = () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return false;
    }
    
    if (!password.trim()) {
      setError('Please enter your password');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    return true;
  };

  const handleSignIn = async () => {
    // Clear any previous errors
    setError(null);
    
    // Validate form first
    if (!validateForm()) {
      return; // Stop here if validation fails
    }

    try {
      setLoading(true);
      await signIn(email.trim(), password);
    } catch (error) {
      console.error('Sign in error:', error);
      // Error is already handled in AuthContext, but we can add additional handling here
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    console.log('[LOGIN] Sign up button pressed');
    setError(null); // Clear any errors
    router.push('/register');
  };

  const handleTestButton = () => {
    console.log('[LOGIN] Test button pressed!');
    Alert.alert('Test', 'Test button works!');
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <Animated.View
        style={[
          styles.glowContainer,
          {
            opacity: glowOpacity,
          },
        ]}
      >
        <View style={[styles.glow, { backgroundColor: colors.primary }]} />
        <View style={[styles.glowSecondary, { backgroundColor: colors.secondary }]} />
      </Animated.View>

      <Card variant="glow" style={styles.card}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>Sign in to continue</Text>

        <Input
          placeholder="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError(null); // Clear error when user types
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <Input
          placeholder="Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError(null); // Clear error when user types
          }}
          secureTextEntry
          style={styles.input}
        />

        {(error || authError) && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error || authError}
            </Text>
          </View>
        )}

        <Button
          title={loading ? 'Signing In...' : 'Sign In'}
          onPress={handleSignIn}
          variant="neon"
          size="large"
          style={styles.button}
          disabled={loading}
        />

        <Button
          title="Don't have an account? Sign up"
          onPress={handleSignUp}
          variant="outline"
          size="medium"
          style={styles.registerButton}
        />

        <Button
          title="TEST BUTTON"
          onPress={handleTestButton}
          variant="neon"
          size="small"
          style={styles.testButton}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
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
    padding: SPACING.xl,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.xl,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.md,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  input: {
    marginBottom: SPACING.md,
  },
  button: {
    marginTop: SPACING.md,
  },
  errorContainer: {
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.sm,
    textAlign: 'center',
  },
  registerButton: {
    marginTop: SPACING.md,
  },
  testButton: {
    marginTop: SPACING.sm,
  },
}); 