
import { View, Text, ScrollView, Image, TouchableOpacity, StatusBar, _Image } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth, useUser } from '@clerk/clerk-expo'
import { LinearGradient } from 'expo-linear-gradient'

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
                    <TouchableOpacity className="relative p-1 rounded-full border border-purple-500">
                        {user?.imageUrl ? (
                            <View className="relative">

                                <Image
                                    source={{ uri: user.imageUrl }}
                                    className="absolute w-8 h-8 rounded-full opacity-30"
                                    blurRadius={50}
                                    style={{ transform: [{ scale: 1.5 }] }}
                                />


                                <Image
                                    source={{ uri: user.imageUrl }}
                                    className="w-8 h-8 rounded-full"
                                />
                            </View>
                        ) : (
                            <Ionicons name="person" size={20} color="#fafafa" />
                        )}
                    </TouchableOpacity>

                </View>
                <View className="flex-1 justify-center items-center">
                    <Text className="text-white">YAHA DASHBOARD KIND OF SHIT AEGI</Text>
                </View>
            </SafeAreaView>
        </LinearGradient>
    )
}

export default HomeScreen