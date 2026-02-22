import { View, Text, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const userProfile = () => {
    const { user } = useUser();
    const router = useRouter();
  return (
    <TouchableOpacity
        onPress={() => router.push('/profile')}
        className="relative p-1 rounded-full border border-purple-500"
    >
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
   
  )
}

export default userProfile