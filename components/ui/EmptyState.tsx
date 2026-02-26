import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export default function EmptyState({ onPress }: { onPress: () => void }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 24 }}>
      <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(124,58,237,0.12)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
        <Ionicons name="rocket-outline" size={20} color="#7c3aed" />
      </View>
      <Text className="font-dmsans text-sm text-gray-500">No apps yet</Text>
      <TouchableOpacity onPress={onPress} style={{ marginTop: 8 }}>
        <Text className="font-dmsans text-sm text-purple-500">+ Create your first app</Text>
      </TouchableOpacity>
    </View>
  )
}
