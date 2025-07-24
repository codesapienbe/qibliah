import KaabaIcon from '@/components/KaabaIcon';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Link, Stack } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function NotFoundScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme].background }] }>
        <View style={[styles.glassCard, colorScheme === 'dark' ? styles.glassCardDark : styles.glassCardLight]}>
          <View style={{ marginBottom: 24 }}>
            <KaabaIcon size={64} color={Colors[colorScheme].primary} />
          </View>
          <ThemedText type="title" style={{ fontSize: 28, fontWeight: 'bold', color: Colors[colorScheme].primary, marginBottom: 12 }}>
            This page does not exist
          </ThemedText>
          <ThemedText style={{ color: Colors[colorScheme].secondary, fontSize: 16, marginBottom: 28, textAlign: 'center' }}>
            The page you are looking for could not be found. It might have been moved or deleted.
          </ThemedText>
          <Link href="/" asChild>
            <TouchableOpacity style={[styles.button, { backgroundColor: Colors[colorScheme].primary }] }>
              <ThemedText style={{ color: Colors[colorScheme].icon, fontWeight: 'bold', fontSize: 18 }}>Go to Home</ThemedText>
            </TouchableOpacity>
          </Link>
        </View>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  glassCard: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    padding: 32,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    borderWidth: 1,
    borderColor: 'rgba(200,200,200,0.25)',
    // backgroundColor is set by glassCardLight or glassCardDark
  },
  glassCardLight: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    // For web: backdropFilter: 'blur(12px)',
  },
  glassCardDark: {
    backgroundColor: 'rgba(30,32,40,0.55)',
    // For web: backdropFilter: 'blur(12px)',
  },
  button: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
});
