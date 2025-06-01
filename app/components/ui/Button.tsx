import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { BORDER_RADIUS, FONTS, SPACING } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'default' | 'outline' | 'neon' | 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'default',
  size = 'medium',
  style,
  textStyle,
  icon,
  disabled = false,
}: ButtonProps) {
  const { colors } = useTheme();

  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BORDER_RADIUS.md,
      opacity: disabled ? 0.5 : 1,
    };

    switch (variant) {
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.primary,
        };
      case 'neon':
        return {
          ...baseStyle,
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 10,
          elevation: 5,
        };
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: colors.primary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colors.secondary,
        };
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: colors.error,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: colors.primary,
        };
    }
  };

  const getTextStyles = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontFamily: FONTS.medium,
      color: variant === 'outline' ? colors.primary : colors.background.primary,
    };

    switch (size) {
      case 'small':
        return { ...baseStyle, fontSize: FONTS.sizes.sm, paddingVertical: SPACING.xs };
      case 'large':
        return { ...baseStyle, fontSize: FONTS.sizes.lg, paddingVertical: SPACING.md };
      default:
        return { ...baseStyle, fontSize: FONTS.sizes.md, paddingVertical: SPACING.sm };
    }
  };

  const getPadding = (): ViewStyle => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: SPACING.md };
      case 'large':
        return { paddingHorizontal: SPACING.xl };
      default:
        return { paddingHorizontal: SPACING.lg };
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyles(), getPadding(), style]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
          color={variant === 'outline' ? colors.primary : colors.background.primary}
          style={{ marginRight: SPACING.xs }}
        />
      )}
      <Text style={[getTextStyles(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
} 