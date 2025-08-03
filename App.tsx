import 'react-native-gesture-handler';
import React from 'react';
import { LogBox } from 'react-native';
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Suppress specific warnings that might be causing issues
LogBox.ignoreLogs([
  'Warning: Failed prop type',
  'Non-serializable values were found in the navigation state',
]);

export default function App() {
  return (
    <ExpoRoot 
      // @ts-ignore - context exists but TypeScript doesn't recognize it
      context={require.context('./app')} 
    />
  );
}

registerRootComponent(App); 