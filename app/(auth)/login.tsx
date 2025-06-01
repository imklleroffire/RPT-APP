import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
  const { signIn } = useAuth();
  const { colors } = useTheme();

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signIn(email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <Card style={styles.card}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>Sign in to continue</Text>

        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        {error && (
          <Text style={[styles.error, { color: colors.error }]}>
            {error}
          </Text>
        )}

        <Button
          title="Sign In"
          onPress={handleSignIn}
          variant="primary"
          size="large"
          style={styles.button}
          disabled={loading}
        />

        <TouchableOpacity
          onPress={() => router.push('/register')}
          style={styles.registerLink}
        >
          <Text style={[styles.registerText, { color: colors.primary }]}>
            Don't have an account? Sign up
          </Text>
        </TouchableOpacity>
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
  error: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.sm,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  registerLink: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  registerText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.md,
  },
}); 