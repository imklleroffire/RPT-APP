import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { LogBox, View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';

// Performance tracking
const performanceMarks: { [key: string]: number } = {};
const mark = (label: string) => {
  performanceMarks[label] = Date.now();
  console.log(`[PERFORMANCE] Mark: ${label} at ${new Date().toISOString()}`);
};
const measure = (startLabel: string, endLabel: string) => {
  const start = performanceMarks[startLabel];
  const end = performanceMarks[endLabel];
  if (start && end) {
    console.log(`[PERFORMANCE] Duration ${startLabel} -> ${endLabel}: ${end - start}ms`);
  }
};

// Enhanced console logging with timestamps and stack traces
const originalConsoleLog = console.log;
console.log = (...args) => {
  const timestamp = new Date().toISOString();
  const stack = new Error().stack?.split('\n').slice(2).join('\n');
  originalConsoleLog.apply(console, [
    `[${timestamp}] [DEBUG]`,
    ...args,
    '\nStack:', stack
  ]);
};

// Enhanced error logging with timestamps and stack traces
const originalConsoleError = console.error;
console.error = (...args) => {
  const timestamp = new Date().toISOString();
  const stack = new Error().stack?.split('\n').slice(2).join('\n');
  originalConsoleError.apply(console, [
    `[${timestamp}] [ERROR]`,
    ...args,
    '\nStack:', stack
  ]);
};

// Enhanced warning logging with timestamps and stack traces
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  const timestamp = new Date().toISOString();
  const stack = new Error().stack?.split('\n').slice(2).join('\n');
  originalConsoleWarn.apply(console, [
    `[${timestamp}] [WARN]`,
    ...args,
    '\nStack:', stack
  ]);
};

// Add global unhandled promise rejection handler with detailed logging
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [UNHANDLED REJECTION]`, {
      reason: event.reason,
      stack: event.reason?.stack,
      promise: event.promise,
      time: new Date().toISOString()
    });
  });
}

// Initialize Firebase services
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

// Error boundary component with enhanced logging
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
    console.log('[ERROR BOUNDARY] Initialized');
  }

  static getDerivedStateFromError(error: Error) {
    console.error('[ERROR BOUNDARY] Caught error:', {
      message: error.message,
      stack: error.stack,
      time: new Date().toISOString()
    });
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ERROR BOUNDARY] Error details:', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      componentStack: errorInfo.componentStack,
      time: new Date().toISOString()
    });
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      console.log('[ERROR BOUNDARY] Rendering error UI');
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: 'red' }}>
            Error Loading App
          </Text>
          <Text style={{ textAlign: 'center', marginBottom: 20 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Text style={{ textAlign: 'center' }}>
            Please restart the app. If the problem persists, contact support.
          </Text>
          {this.state.errorInfo && (
            <Text style={{ fontSize: 12, color: '#999', marginTop: 20 }}>
              {this.state.errorInfo.componentStack}
            </Text>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [initStep, setInitStep] = useState('');
  const [initTime, setInitTime] = useState<number>(Date.now());
  const [initState, setInitState] = useState<{[key: string]: any}>({});

  useEffect(() => {
    async function initializeApp() {
      mark('app-init-start');
      try {
        console.log('[INIT] Starting app initialization...', {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          platform: Platform.OS
        });
        setInitStep('Starting initialization');

        // Import Firebase configuration
        mark('firebase-import-start');
        console.log('[INIT] Importing Firebase configuration...');
        setInitStep('Importing Firebase');
        const { app, auth, db, storage } = await import('./app/config/firebase');
        measure('firebase-import-start', 'firebase-import-end');
        
        console.log('[INIT] Firebase configuration imported successfully', { 
          app: !!app, 
          auth: !!auth, 
          db: !!db, 
          storage: !!storage,
          time: new Date().toISOString()
        });

        // Verify Firebase services
        mark('firebase-verify-start');
        console.log('[INIT] Verifying Firebase services...');
        setInitStep('Verifying Firebase services');
        
        const serviceStatus = {
          app: !!app,
          auth: !!auth,
          db: !!db,
          storage: !!storage
        };
        
        setInitState(prev => ({ ...prev, serviceStatus }));
        
        if (!app || !auth || !db || !storage) {
          const missingServices = [];
          if (!app) missingServices.push('app');
          if (!auth) missingServices.push('auth');
          if (!db) missingServices.push('db');
          if (!storage) missingServices.push('storage');
          throw new Error(`Firebase services failed to initialize: ${missingServices.join(', ')}`);
        }
        measure('firebase-verify-start', 'firebase-verify-end');
        console.log('[INIT] Firebase services verified successfully');

        // Initialize other services here if needed
        mark('other-services-start');
        console.log('[INIT] Initializing other services...');
        setInitStep('Initializing other services');
        measure('other-services-start', 'other-services-end');

        const initDuration = Date.now() - initTime;
        console.log('[INIT] App initialization completed successfully', { 
          duration: `${initDuration}ms`,
          timestamp: new Date().toISOString(),
          services: serviceStatus
        });
        
        measure('app-init-start', 'app-init-end');
        console.log('[APP] About to setIsInitialized(true)');
        setIsInitialized(true);
        console.log('[APP] setIsInitialized(true) called');
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown initialization error');
        console.error('[INIT] Error during app initialization:', {
          error: error.message,
          stack: error.stack,
          step: initStep,
          duration: `${Date.now() - initTime}ms`,
          state: initState,
          time: new Date().toISOString()
        });
        setError(error);
      }
    }

    initializeApp();
  }, []);

  if (error) {
    console.log('[APP] Rendering error UI:', error.message);
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
        <Text style={styles.errorDetails}>Initialization step: {initStep}</Text>
        {error.stack && (
          <Text style={styles.errorStack}>{error.stack}</Text>
        )}
      </View>
    );
  }

  if (!isInitialized) {
    console.log('[APP] Rendering loading UI. Current step:', initStep);
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Initializing app...</Text>
        <Text style={styles.stepText}>Current step: {initStep}</Text>
      </View>
    );
  }

  console.log('[APP] Rendering main return. isInitialized:', isInitialized, 'error:', error);
  return (
    <ExpoRoot 
      // @ts-ignore - context exists but TypeScript doesn't recognize it
      context={require.context('./app')} 
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
  },
  stepText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorDetails: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorStack: {
    fontSize: 12,
    color: '#999',
    marginTop: 20,
    textAlign: 'left',
  },
});

// Wrap the root component with error boundary
const AppWithErrorBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

registerRootComponent(AppWithErrorBoundary); 