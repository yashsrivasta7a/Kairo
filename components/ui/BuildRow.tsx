import React from 'react'
import { TouchableOpacity, View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Chip from './Chip'
import { useColorScheme } from 'nativewind'

export default function BuildRow({ build, onPress, last }: { build: any; onPress: () => void; last: boolean }) {
  const { colorScheme } = useColorScheme()
  const dk = colorScheme === 'dark'
  return (
    <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
      <View style={{ marginRight: 12, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: dk ? 'rgba(167,139,250,0.3)' : '#e9d5ff', backgroundColor: dk ? 'rgba(124,58,237,0.15)' : '#f3e8ff' }}>
        <Ionicons name="cube-outline" size={16} color={dk ? '#a78bfa' : '#7c3aed'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: dk ? '#e9d5ff' : '#1e1b4b' }} numberOfLines={1}>{build.slug || 'Untitled'}</Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, marginTop: 2, color: dk ? 'rgba(167,139,250,0.7)' : '#6b7280' }}>{build.updatedAt ? new Date(build.updatedAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jan 10, 2022'}</Text>
      </View>
      <Chip status={build.status} />
    </TouchableOpacity>
  )
}
