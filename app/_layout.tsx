import { Stack } from 'expo-router';
import React from 'react';

// Minimal AuthProvider for testing
function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Minimal ThemeProvider for testing  
function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Minimal NotificationProvider for testing
function NotificationProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ThemeProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(patient-tabs)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(therapist-tabs)" />
          </Stack>
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
