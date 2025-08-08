import { Colors } from '@/constants/Colors';
import { SUPPORTED_TIMEZONES, SupportedTimezone } from '@/constants/Timezones';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, Image, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface PreloaderProps {
  onComplete: (timezoneSelected: boolean) => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const [logoScale] = useState(new Animated.Value(0.3));
  const [logoOpacity] = useState(new Animated.Value(0));
  const [logoRotation] = useState(new Animated.Value(0));
  const [checkingTimezone, setCheckingTimezone] = useState(true);

  useEffect(() => {
    // Animate logo entrance with rotation
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(logoRotation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Check timezone after animation
    const timer = setTimeout(async () => {
      try {
        const tz = await AsyncStorage.getItem('@prayer_selected_timezone_v1');
        const timezoneSelected = tz && SUPPORTED_TIMEZONES.includes(tz as SupportedTimezone);
        
        // Add a small delay for better UX
        setTimeout(() => {
          onComplete(timezoneSelected);
        }, 800);
      } catch (error) {
        // If there's an error, assume no timezone is selected
        setTimeout(() => {
          onComplete(false);
        }, 800);
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [logoScale, logoOpacity, logoRotation, onComplete]);

  const spin = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [
              { scale: logoScale },
              { rotate: spin }
            ],
          },
        ]}
      >
        <Image
          source={require('../assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
      
      {checkingTimezone && (
        <Animated.View style={[styles.loadingText, { opacity: logoOpacity }]}>
          {/* You can add loading text here if needed */}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 20,
  },
  loadingText: {
    marginTop: 20,
    alignItems: 'center',
  },
});
