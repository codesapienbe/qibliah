import { logError } from '@/utils/logger';
import React from 'react';
import { Button, Text, View } from 'react-native';

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
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Something went wrong</Text>
          <Text style={{ color: 'red', marginBottom: 8 }}>{this.state.error?.message}</Text>
          <Text style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>
            {this.state.errorInfo?.componentStack}
          </Text>
          <Button title="Try Again" onPress={this.handleReset} />
        </View>
      );
    }
    return this.props.children;
  }
} 