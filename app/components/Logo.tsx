import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
  color?: string;
}

export default function Logo({ size = 120, color = '#4A90E2' }: LogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.text, { color }]}>PT</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    fontSize: 32,
    fontWeight: 'bold',
  },
}); 