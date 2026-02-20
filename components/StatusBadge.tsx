import React from 'react';
import { View, Text } from 'react-native';

const statusStyles: Record<string, { bg: string; text: string }> = {
  completed: { bg: 'bg-green-900/50', text: 'text-green-400' },
  failed: { bg: 'bg-red-900/50', text: 'text-red-400' },
  generating: { bg: 'bg-purple-900/50', text: 'text-purple-400' },
};

const fallback = { bg: 'bg-gray-800', text: 'text-gray-400' };

export default function StatusBadge({ status }: { status?: string }) {
  const s = statusStyles[status ?? ''] ?? fallback;
  return (
    <View className={`rounded-full px-2 py-0.5 ${s.bg}`}>
      <Text className={`text-xs ${s.text}`}>{status || 'idle'}</Text>
    </View>
  );
}
