import React, { useMemo, Component } from 'react';
import { Text, View } from 'react-native';
import codeToEl from './codeToEl';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = { code: string; instantAppId: string };

// Error Boundary to catch rendering errors from generated code
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Generated Code Error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: 'red', textAlign: 'center', fontSize: 14 }}>
            Error rendering generated code: {this.state.error?.message}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

function codeParser({ code, instantAppId }: Props) {
  try {
    if (!instantAppId) {
      throw new Error('instantAppId is missing or empty');
    }
    const el = codeToEl(instantAppId, code);
    return { el };
  } catch (error) {
    console.error('BuildUi Error:', error);
    return { el: <Text style={{ color: 'red' }}>Error parsing code: {(error as Error).message}</Text> };
  }
}

const BuildUi: React.FC<Props> = ({ code, instantAppId }) => {
  const parsed = useMemo(() => codeParser({ code, instantAppId }), [code, instantAppId]);
  
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ErrorBoundary>
        <View style={{ flex: 1 }}>
          {parsed.el}
        </View>
      </ErrorBoundary>
    </SafeAreaView>
  );
};

export default BuildUi;