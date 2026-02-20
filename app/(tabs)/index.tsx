
import { View, Text, ScrollView, Image, TouchableOpacity, StatusBar, _Image } from 'react-native'
import React, { useState } from 'react'
import { useCreateModalStore } from '../../lib/store'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth, useUser } from '@clerk/clerk-expo'
import { LinearGradient } from 'expo-linear-gradient'
import { SignOutButton } from 'components/Buttons/signout'
import { useRouter } from 'expo-router'
import UserProfile from 'components/userProfile'

const HomeScreen = () => {
    const { user, isLoaded } = useUser()
    
    if (!isLoaded) return null;
    return (
        <LinearGradient
            colors={['#0d031fff', '#000000']}
            start={{ x: 0.09, y: 0.09 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
        >


            <SafeAreaView className="flex-1 px-6">
                <StatusBar barStyle="light-content" />
                <View className="flex-row items-center justify-between py-3 ">
                    <View>
                        <Ionicons name="logo-gitlab" size={28} color="white" />
                    </View>
                    
<UserProfile/>
                </View>
                <View className="flex-1 justify-center items-center">
                    <Text className="text-white text-2xl font-bold mb-4">Welcome back, {user?.firstName || 'Developer'}!</Text>
                   <SignOutButton/>
                </View>
            </SafeAreaView>
        </LinearGradient>
    )
}

export default HomeScreen