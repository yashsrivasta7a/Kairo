import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import StatusBadge from './StatusBadge';

interface CodeViewerProps {
  code?: string;
  status?: string;
  streaming?: string;
}

export default function CodeViewer({ code, status, streaming }: CodeViewerProps) {
  return (
    <View className="mt-4 flex-[2] rounded-xl border border-white/10 bg-white/5">
      <View className="flex-row items-center justify-between border-b border-white/10 px-4 py-2">
        <Text className="text-xs font-semibold uppercase tracking-wider text-white/60">
          Generated Code
        </Text>
        <View className="flex-row items-center gap-2">
          {streaming === 'true' && (
            <View className="flex-row items-center gap-1">
              <ActivityIndicator size="small" color="#8B5CF6" />
              <Text className="text-xs text-purple-400">Streaming...</Text>
            </View>
          )}
          <StatusBadge status={status} />
        </View>
      </View>
      <ScrollView className="flex-1 p-4">
        {code ? (
          <Text className="font-mono text-xs leading-5 text-green-300">{code}</Text>
        ) : (
          <Text className="text-sm text-gray-500">
            No code generated yet. Enter a prompt and hit generate.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
