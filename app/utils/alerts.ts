import { Alert, Platform } from 'react-native';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export const showAlert = (title: string, message: string, buttons?: AlertButton[]) => {
  if (Platform.OS === 'web') {
    // For web, use window.alert as fallback
    window.alert(`${title}\n${message}`);
    if (buttons && buttons.length > 0) {
      const lastButton = buttons[buttons.length - 1];
      if (lastButton.onPress) {
        lastButton.onPress();
      }
    }
  } else {
    Alert.alert(title, message, buttons);
  }
}; 