import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { logError } from '@/utils/logger';
import React from 'react';
import { Button } from 'react-native';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    this.setState({ hasError: true, error, errorInfo });
    logError(error, 'ErrorBoundary: ' + errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const colorScheme = useColorScheme?.() ?? 'light';
      return (
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: Colors[colorScheme].background }}>
          <ThemedText style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: Colors[colorScheme].primary }}>Something went wrong</ThemedText>
          <ThemedText style={{ color: Colors[colorScheme].error, marginBottom: 8 }}>{this.state.error?.message}</ThemedText>
          <ThemedText style={{ fontSize: 12, color: Colors[colorScheme].text, marginBottom: 16 }}>
            {this.state.errorInfo?.componentStack}
          </ThemedText>
          <Button title="Try Again" onPress={this.handleReset} color={Colors[colorScheme].primary} />
        </ThemedView>
      );
    }
    return this.props.children;
  }
} 