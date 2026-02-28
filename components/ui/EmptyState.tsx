import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useColorScheme } from 'nativewind'

export default function EmptyState({ onPress }: { onPress: () => void }) {
  const { colorScheme } = useColorScheme()
  const dk = colorScheme === 'dark'
  return (
    <View style={{ alignItems: 'center', paddingVertical: 24 }}>
      <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: dk ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.1)', borderWidth: 1, borderColor: dk ? 'rgba(124,58,237,0.4)' : 'rgba(124,58,237,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
        <Ionicons name="rocket-outline" size={20} color={dk ? '#c4b5fd' : '#7c3aed'} />
      </View>
      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: dk ? 'rgba(196,181,253,0.6)' : '#6b7280' }}>No apps yet</Text>
      <TouchableOpacity onPress={onPress} style={{ marginTop: 8 }}>
        <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: dk ? '#a78bfa' : '#7c3aed' }}>+ Create your first app</Text>
      </TouchableOpacity>
    </View>
  )
}
