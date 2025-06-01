// This file is a fallback for using MaterialIcons on Android and web.

import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export function IconSymbol({ name, size, color, style }: { 
  name: string, 
  size: number, 
  color: string, 
  style?: any 
}) {
  // Convert the custom icon names to Ionicons names
  const getIoniconName = (name: string) => {
    const iconMap: { [key: string]: string } = {
      'home': 'home',
      'fitness': 'fitness',
      'flame': 'flame',
      'people': 'people',
      'layers': 'layers',
      'business': 'business',
      'settings': 'settings',
      'chevron.left.forwardslash.chevron.right': 'code'
      // Add more mappings as needed
    };
    return iconMap[name] || name;
  };

  return (
    <Ionicons 
      name={getIoniconName(name) as any} 
      size={size} 
      color={color} 
      style={style} 
    />
  );
}
