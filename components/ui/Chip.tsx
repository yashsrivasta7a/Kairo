import React from 'react'
import { View, Text } from 'react-native'

export default function Chip({ status }: { status?: string }) {
  const S: any = {
    done: { bg: 'bg-green-100', text: 'text-green-700', label: 'Done' },
    building: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Building' },
    queued: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Queued' },
    failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },
  }
  const meta = S[status as keyof typeof S] || { bg: 'bg-slate-100', text: 'text-slate-700', label: status || 'Unknown' }
  return (
    <View className={`rounded-full px-2 py-0.5 ${meta.bg}`}>
      <Text className={`${meta.text} font-dmsans text-[12px]`}>{meta.label}</Text>
    </View>
  )
}
