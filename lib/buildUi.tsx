import React, { useMemo } from 'react';
import { Text } from 'react-native';
import codeToEl from './codeToEl';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = { code?: string; instantId?: string };

function codeParser({ code, instantId }: Props) {
  try {
    const el = codeToEl(instantId, code);
    return { el };
  } catch (error) {
    return { el: <Text style={{ color: 'red' }}>Error parsing code: {(error as Error).message}</Text> };
  }
}

const BuildUi: React.FC<Props> = ({ code, instantId }) => {
  const parsed = useMemo(() => codeParser({ code, instantId }), [code, instantId]);
  const { el } = parsed;
  return <SafeAreaView style={{ flex: 1 }}>{el}</SafeAreaView>;
};

export default BuildUi;