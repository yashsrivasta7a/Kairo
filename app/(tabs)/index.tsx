
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
                    <View className="items-center">
                        <Image
                            source={{ uri: 'https://static.vecteezy.com/system/resources/previews/051/691/288/non_2x/a-man-with-glasses-and-curly-hair-is-shown-in-a-black-and-white-silhouette-free-vector.jpg' }}
                            accessibilityLabel="Curly-haired avatar with specs"
                            style={{ width: 160, height: 160, borderRadius: 80, marginBottom: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.08)' }}
                        />
                        <Text className="text-white text-2xl font-bold mb-1">Welcome back, Madrasi !!</Text>
                        
                    </View>
                   <SignOutButton  />
                </View>
            </SafeAreaView>
        </LinearGradient>
    )
}

export default HomeScreen