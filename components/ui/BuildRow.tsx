import React from 'react'
import { TouchableOpacity, View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Chip from './Chip'

export default function BuildRow({ build, onPress, last }: { build: any; onPress: () => void; last: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-lg border border-purple-200 bg-purple-100">
        <Ionicons name="cube-outline" size={16} color="#a78bfa" />
      </View>
      <View style={{ flex: 1 }}>
        <Text className="font-dmsans text-sm font-semibold text-slate-900" numberOfLines={1}>{build.slug || 'Untitled'}</Text>
        <Text className="font-dmsans mt-1 text-xs text-gray-500">{build.updatedAt ? new Date(build.updatedAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jan 10, 2022'}</Text>
      </View>
      <Chip status={build.status} />
    </TouchableOpacity>
  )
}
