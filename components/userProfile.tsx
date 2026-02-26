import { View, Text, TouchableOpacity, Image, GestureResponderEvent } from 'react-native'
import React from 'react'
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type Props = {
    className?: string
    avatarClassName?: string
    onPress?: (e: GestureResponderEvent) => void
    size?: number
}

const UserProfile: React.FC<Props> = ({ className = '', avatarClassName = '', onPress, size = 40 }) => {
    const { user } = useUser();
    const router = useRouter();
    const handle = onPress ?? (() => router.push('/profile'))
    const imgStyle = { width: size, height: size, borderRadius: size / 2 }
    const blurScale = 1.6
    const outerPadding = Math.max(6, Math.round(size * 0.14))

    return (
        <TouchableOpacity
            onPress={handle}
            className={`relative rounded-full border border-purple-500 ${className}`}
            style={{ padding: outerPadding }}>
            {user?.imageUrl ? (
                <View className="relative">
                    <Image
                        source={{ uri: user.imageUrl }}
                        className={`absolute rounded-full opacity-30 ${avatarClassName}`}
                        blurRadius={50}
                        style={{ transform: [{ scale: blurScale }], ...imgStyle }}
                    />

                    <Image source={{ uri: user.imageUrl }} className={`rounded-full ${avatarClassName}`} style={imgStyle} />
                </View>
            ) : (
                <Ionicons name="person" size={Math.round(size * 0.5)} color="#fafafa" />
            )}
        </TouchableOpacity>
    )
}

export default UserProfile