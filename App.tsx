import 'react-native-gesture-handler';
import { LogBox } from 'react-native';

// Suppress specific warnings
LogBox.ignoreLogs([
  'Warning: Failed prop type',
  'Non-serializable values were found in the navigation state',
]);

// This is just for configuration
export default function App() {
  return null;
}