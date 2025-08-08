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

const ErrorFallback: React.FC<{
  error: Error | null;
  errorInfo: { componentStack: string } | null;
  onReset: () => void;
}> = ({ error, errorInfo, onReset }) => {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: Colors[colorScheme].background }}>
      <ThemedText style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: Colors[colorScheme].primary }}>Something went wrong</ThemedText>
      <ThemedText style={{ color: Colors[colorScheme].error, marginBottom: 8 }}>{error?.message}</ThemedText>
      <ThemedText style={{ fontSize: 12, color: Colors[colorScheme].text, marginBottom: 16 }}>
        {errorInfo?.componentStack}
      </ThemedText>
      <Button title="Try Again" onPress={onReset} color={Colors[colorScheme].primary} />
    </ThemedView>
  );
};

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
    // Log and notify with a code, then auto-reset to avoid blocking UI
    Promise.resolve(logError(error, 'ErrorBoundary: ' + errorInfo.componentStack))
      .finally(() => {
        setTimeout(() => {
          this.handleReset();
        }, 0);
      });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }
    return this.props.children;
  }
} 