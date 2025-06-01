import { useFonts } from 'expo-font';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import 'react-native-reanimated';
import { useAuth } from './context/AuthContext';
import { useRouter, useSegments } from 'expo-router';
import LoadingScreen from './components/LoadingScreen';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { View, Platform } from 'react-native';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading, isPendingVerification } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  // Mark component as mounted
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Handle navigation logic only after mounting
  useEffect(() => {
    if (!isMounted || loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inPatientTabs = segments[0] === '(patient-tabs)';
    const inTherapistTabs = segments[0] === '(tabs)';

    if (isPendingVerification) {
      // If verification is pending, stay on verification screen
      if (segments[segments.length - 1] !== 'verification') {
        router.replace('/verification');
      }
    } else if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (user) {
      if (inAuthGroup) {
        // Redirect to appropriate tabs based on role
        if (user.role === 'patient') {
          router.replace('/(patient-tabs)/home');
        } else {
          router.replace('/(tabs)/home');
        }
      } else if (user.role === 'patient' && inTherapistTabs) {
        // Redirect patient to patient tabs if they somehow end up in therapist tabs
        router.replace('/(patient-tabs)/home');
      } else if (user.role === 'therapist' && inPatientTabs) {
        // Redirect therapist to therapist tabs if they somehow end up in patient tabs
        router.replace('/(tabs)/home');
      }
    }
  }, [user, loading, segments, isMounted, router, isPendingVerification]);

  if (loading || !isMounted) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(patient-tabs)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen 
        name="patient-detail/[id]" 
        options={{ 
          presentation: 'modal'
        }} 
      />
      <Stack.Screen 
        name="bundle-detail/[id]" 
        options={{ 
          presentation: 'modal'
        }} 
      />
      <Stack.Screen 
        name="clinic-management" 
        options={{ 
          presentation: 'modal'
        }} 
      />
      <Stack.Screen 
        name="notifications" 
        options={{ 
          presentation: 'modal'
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    'SpaceMono': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Mark as mounted
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        // Add any pre-loading steps here
        await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay for stability
      } catch (e) {
        console.warn(e);
      } finally {
        if (isMounted) {
          setAppIsReady(true);
        }
      }
    }

    if (isMounted) {
      prepare();
    }
  }, [isMounted]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && (fontsLoaded || fontError) && isMounted) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded, fontError, isMounted]);

  if (!appIsReady || (!fontsLoaded && !fontError) || !isMounted) {
    return <LoadingScreen />;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AuthProvider>
        <NotificationProvider>
          <ThemeProvider>
            <StatusBar style="auto" />
            <RootLayoutNav />
          </ThemeProvider>
        </NotificationProvider>
      </AuthProvider>
    </View>
  );
}
