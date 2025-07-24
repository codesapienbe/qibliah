import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, Polygon, Rect } from 'react-native-svg';

const KaabaIcon = ({ size = 100, color }: { size?: number; color?: string }) => {
  const colorScheme = useColorScheme?.() ?? 'light';
  const mainColor = color || Colors[colorScheme].icon;
  return (
    <View style={styles.container}>
      <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
        {/* Kaaba Base */}
        <Rect
          x="25"
          y="30"
          width="50"
          height="70"
          fill={mainColor}
          stroke="#5D4037"
          strokeWidth="2"
        />
        {/* Kaaba Door */}
        <Rect
          x="45"
          y="60"
          width="10"
          height="40"
          fill="#4E342E"
          stroke="#3E2723"
          strokeWidth="1"
        />
        {/* Kaaba Top (Pyramid shape) */}
        <Polygon
          points="25,30 50,10 75,30"
          fill={mainColor}
          stroke="#5D4037"
          strokeWidth="2"
        />
        {/* Decorative Elements */}
        <Path
          d="M35 40 L65 40 M35 50 L65 50 M35 60 L45 60 M55 60 L65 60"
          stroke="#5D4037"
          strokeWidth="1"
        />
        {/* Black Kiswah Cover */}
        <Rect
          x="25"
          y="30"
          width="50"
          height="15"
          fill="#212121"
          stroke="#000000"
          strokeWidth="1"
        />
        {/* Gold Trim */}
        <Rect
          x="25"
          y="45"
          width="50"
          height="3"
          fill="#FFD700"
          stroke="#FFC107"
          strokeWidth="0.5"
        />
        {/* Gold Door Trim */}
        <Rect
          x="45"
          y="60"
          width="10"
          height="3"
          fill="#FFD700"
          stroke="#FFC107"
          strokeWidth="0.5"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default KaabaIcon; 