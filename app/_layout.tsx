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
import { View } from 'react-native';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading, isPendingVerification } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize after a short delay to ensure everything is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

    // Handle navigation logic
  useEffect(() => {
    if (!isInitialized || loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inPatientTabs = segments[0] === '(patient-tabs)';
    const inTherapistTabs = segments[0] === '(tabs)';

    console.log('[NAVIGATION] Current segments:', segments);
    console.log('[NAVIGATION] User:', !!user, 'Role:', user?.role);
    console.log('[NAVIGATION] isPendingVerification:', isPendingVerification);

    if (isPendingVerification) {
      if (segments[segments.length - 1] !== 'verification') {
        console.log('[NAVIGATION] Redirecting to verification');
        router.replace('/(auth)/verification');
      }
    } else if (!user) {
      // User is not authenticated, redirect to login
      if (!inAuthGroup || (segments[segments.length - 1] !== 'register' && segments[segments.length - 1] !== 'verification')) {
        console.log('[NAVIGATION] Redirecting to login');
        router.replace('/(auth)/login');
      }
    } else if (user) {
      // User is authenticated, redirect based on role
      if (inAuthGroup) {
        if (user.role === 'patient') {
          console.log('[NAVIGATION] Redirecting patient to home');
          router.replace('/(patient-tabs)/home');
        } else {
          console.log('[NAVIGATION] Redirecting therapist to home');
          router.replace('/(tabs)/home');
        }
      } else if (user.role === 'patient' && inTherapistTabs) {
        console.log('[NAVIGATION] Patient in wrong tabs, redirecting');
        router.replace('/(patient-tabs)/home');
      } else if (user.role === 'therapist' && inPatientTabs) {
        console.log('[NAVIGATION] Therapist in wrong tabs, redirecting');
        router.replace('/(tabs)/home');
      }
    }
  }, [user, loading, segments, router, isPendingVerification, isInitialized]);

  if (loading || !isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(patient-tabs)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen 
        name="patient-detail/[id]" 
        options={{ presentation: 'modal' }} 
      />
      <Stack.Screen 
        name="bundle-detail/[id]" 
        options={{ presentation: 'modal' }} 
      />
      <Stack.Screen 
        name="clinic-management" 
        options={{ presentation: 'modal' }} 
      />
      <Stack.Screen 
        name="notifications" 
        options={{ presentation: 'modal' }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    'SpaceMono': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Ensure everything is loaded
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (e) {
        console.warn('Error during app preparation:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady || (!fontsLoaded && !fontError)) {
    return <LoadingScreen />;
  }

  return (
    <AuthProvider>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <NotificationProvider>
          <ThemeProvider>
            <StatusBar style="auto" />
            <RootLayoutNav />
          </ThemeProvider>
        </NotificationProvider>
      </View>
    </AuthProvider>
  );
}
