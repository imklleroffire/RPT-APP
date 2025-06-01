// This is a shim for web and Android where the tab bar is generally opaque.
import React from 'react';
import { View, ViewProps, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import TabBarBackgroundIOS, { useBottomTabOverflow as useBottomTabOverflowIOS } from './TabBarBackground.ios';
import TabBarBackgroundAndroid, { useBottomTabOverflow as useBottomTabOverflowAndroid } from './TabBarBackground.android';

export default Platform.select({
  ios: TabBarBackgroundIOS,
  android: TabBarBackgroundAndroid,
  default: TabBarBackgroundIOS,
});

export const useBottomTabOverflow = Platform.select({
  ios: useBottomTabOverflowIOS,
  android: useBottomTabOverflowAndroid,
  default: useBottomTabOverflowIOS,
});
