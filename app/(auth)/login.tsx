import React, { useState } from 'react';
<<<<<<< HEAD
import { View, Text, StyleSheet, Animated, Alert } from 'react-native';
=======
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
>>>>>>> f5c093816e5096fba21e0e61529f41a0089cd6b9
import { router } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
<<<<<<< HEAD
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
=======

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
>>>>>>> f5c093816e5096fba21e0e61529f41a0089cd6b9
    }

    try {
      setLoading(true);
<<<<<<< HEAD
      await signIn(email.trim(), password);
    } catch (error) {
      console.error('Sign in error:', error);
      // Error is already handled in AuthContext, but we can add additional handling here
=======
      setError(null);
      
      // Import Firebase auth dynamically to avoid initialization issues
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('../config/firebase');
      
      console.log('Attempting to sign in with:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      console.log('Sign in successful:', userCredential.user.uid);
      Alert.alert('Success', 'Logged in successfully!');
      
      // Navigate to home or dashboard
      router.replace('/home');
      
    } catch (error: any) {
      console.error('Sign in error:', error);
      let errorMessage = 'Failed to sign in';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setError(errorMessage);
>>>>>>> f5c093816e5096fba21e0e61529f41a0089cd6b9
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
<<<<<<< HEAD
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
=======
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
>>>>>>> f5c093816e5096fba21e0e61529f41a0089cd6b9

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError(null); // Clear error when user types
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError(null); // Clear error when user types
          }}
          secureTextEntry
          editable={!loading}
        />

<<<<<<< HEAD
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
=======
        {error && (
          <Text style={styles.error}>{error}</Text>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignIn}
>>>>>>> f5c093816e5096fba21e0e61529f41a0089cd6b9
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

<<<<<<< HEAD
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
=======
        <TouchableOpacity
          onPress={() => router.push('/register')}
          style={styles.registerLink}
          disabled={loading}
        >
          <Text style={styles.registerText}>
            Don't have an account? Sign up
          </Text>
        </TouchableOpacity>
      </View>
>>>>>>> f5c093816e5096fba21e0e61529f41a0089cd6b9
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
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
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
<<<<<<< HEAD
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
=======
  error: {
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  registerLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 16,
    color: '#007AFF',
>>>>>>> f5c093816e5096fba21e0e61529f41a0089cd6b9
  },
}); 