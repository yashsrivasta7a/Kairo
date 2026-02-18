import { useLocalSearchParams } from 'expo-router';
import { View, Text, ScrollView, Image, TouchableOpacity, StatusBar } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth, useUser } from '@clerk/clerk-expo'

export default function EditBuilderScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user, isLoaded } = useUser()
    if (!isLoaded) return null;
    return (
        <SafeAreaView className="flex-1 bg-black px-4">
            <StatusBar barStyle="light-content" />
            <View className="flex-row items-center justify-between py-3">
                <View>
                    <Text className="text-muted text-white text-xs font-medium uppercase tracking-wider">Builds</Text>
                    <View className="flex-row items-center gap-1">
                        <Text className="text-gray-500 text-lg font-bold">APP_NAME</Text>
                        <Ionicons name="chevron-down" size={16} color="#a1a1aa" />
                    </View>
                </View>
                <TouchableOpacity className="bg-card p-2 rounded-full border border-border">
                    {user ? (
                        <Image source={{ uri: user.imageUrl }} className="w-8 h-8 rounded-full" />
                    ) : (
                        <Ionicons name="person" size={20} color="#fafafa" />
                    )}
                </TouchableOpacity>
            </View>
            <View>
                <Text className='text-white'>Home</Text>

            </View>
        </SafeAreaView>
    )
}
