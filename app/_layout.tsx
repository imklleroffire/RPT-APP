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

    // Don't navigate if we're already on the index page
    if (!segments || segments.length === 0) {
      return;
    }
    
    if (segments[0] === 'index') {
      return;
    }

    if (isPendingVerification) {
      if (segments[segments.length - 1] !== 'verification') {
        router.replace('/verification');
      }
    } else if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user) {
      if (inAuthGroup) {
        if (user.role === 'patient') {
          router.replace('/(patient-tabs)/home');
        } else {
          router.replace('/(tabs)/home');
        }
      } else if (user.role === 'patient' && inTherapistTabs) {
        router.replace('/(patient-tabs)/home');
      } else if (user.role === 'therapist' && inPatientTabs) {
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
