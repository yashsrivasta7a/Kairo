import React from 'react'
import { View, Text } from 'react-native'
import { useColorScheme } from 'nativewind'

export default function Chip({ status }: { status?: string }) {
  const { colorScheme } = useColorScheme()
  const dk = colorScheme === 'dark'
  const S: any = dk
    ? {
        done:     { bg: 'rgba(16,185,129,0.18)',  text: '#6ee7b7', label: 'Done' },
        building: { bg: 'rgba(124,58,237,0.25)',  text: '#c4b5fd', label: 'Building' },
        queued:   { bg: 'rgba(234,179,8,0.18)',   text: '#fde68a', label: 'Queued' },
        failed:   { bg: 'rgba(239,68,68,0.18)',   text: '#fca5a5', label: 'Failed' },
      }
    : {
        done:     { bg: '#dcfce7', text: '#15803d', label: 'Done' },
        building: { bg: '#ede9fe', text: '#6d28d9', label: 'Building' },
        queued:   { bg: '#fef9c3', text: '#854d0e', label: 'Queued' },
        failed:   { bg: '#fee2e2', text: '#b91c1c', label: 'Failed' },
      }
  const meta = S[status as keyof typeof S] || (dk
    ? { bg: 'rgba(255,255,255,0.1)', text: '#d1d5db', label: status || 'Unknown' }
    : { bg: '#f1f5f9', text: '#475569', label: status || 'Unknown' })
  return (
    <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: meta.bg }}>
      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: meta.text }}>{meta.label}</Text>
    </View>
  )
}
