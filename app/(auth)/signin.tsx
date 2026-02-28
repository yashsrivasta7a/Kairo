
import { useSSO } from '@clerk/clerk-expo'
import * as AuthSession from 'expo-auth-session'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import React, { useCallback, useEffect } from 'react'
import { Image, Platform, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

export const useWarmUpBrowser = () => {
    useEffect(() => {
        if (Platform.OS !== 'android') return
        void WebBrowser.warmUpAsync()
        return () => {
            void WebBrowser.coolDownAsync()
        }
    }, [])
}

WebBrowser.maybeCompleteAuthSession()

export default function Page() {
    useWarmUpBrowser()
    const router = useRouter()
    const { startSSOFlow } = useSSO()
    const { colorScheme } = useColorScheme();
    const dk = colorScheme === 'dark';

    const onSignInPress = useCallback(async (strategy: 'oauth_google' | 'oauth_apple' | 'oauth_github') => {
        try {
            const { createdSessionId, setActive } = await startSSOFlow({
                strategy: strategy,
                redirectUrl: AuthSession.makeRedirectUri({ scheme: 'Kairo' }),
            })

            if (createdSessionId) {
                setActive!({ session: createdSessionId })
                router.replace('/(tabs)');
            }
        } catch (err) {
            console.error(JSON.stringify(err, null, 2))
        }
    }, [])

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: dk ? '#000000' : '#f5f3ff', paddingHorizontal: 24, justifyContent: 'center' }}>
            <View className="items-center mb-7">
                <Text style={{ color: dk ? 'white' : '#3b0764' }} className="text-3xl font-bold mb-2">
                    Welcome Back
                </Text>
                <Text style={{ color: dk ? '#9ca3af' : '#6b7280' }} className="text-center text-base">
                    Sign in to Kairo to continue building
                </Text>
            </View>

            <Pressable
                onPress={() => onSignInPress('oauth_google')}
                className="w-full h-12 bg-white rounded-lg flex-row items-center justify-center mb-4 active:opacity-90"
            >
                <Ionicons name="logo-google" size={20} color="black" style={{ marginRight: 10 }} />
                <Text className="text-black text-base font-medium">
                    Continue with Google
                </Text>
            </Pressable>

            <Pressable
                onPress={() => onSignInPress('oauth_apple')}
                style={{ backgroundColor: dk ? '#262626' : '#1a1a1a', borderColor: dk ? '#404040' : '#333333' }}
                className="w-full h-12 rounded-lg flex-row items-center justify-center mb-4 active:opacity-90 border"
            >
                <Ionicons name="logo-apple" size={20} color="white" style={{ marginRight: 10 }} />
                <Text className="text-white text-base font-medium">
                    Continue with Apple
                </Text>
            </Pressable>

            <Pressable
                onPress={() => onSignInPress('oauth_github')}
                style={{ backgroundColor: dk ? '#171717' : '#24292e', borderColor: dk ? '#2a2a2a' : '#1b1f23' }}
                className="w-full h-12 rounded-lg flex-row items-center justify-center mb-4 active:opacity-90 border"
            >
                <Ionicons name="logo-github" size={20} color="white" style={{ marginRight: 10 }} />
                <Text className="text-white text-base font-medium">
                    Continue with GitHub
                </Text>
            </Pressable>
            <View className='flex-row gap-1 justify-center'>
                <Text style={{ color: dk ? '#6b7280' : '#9ca3af' }} className='text-center text-sm'>Don't have an account? </Text>
                <Pressable onPress={() => router.push('/signup')} className='active:opacity-90'>
                    <Text className='text-center text-sm text-red-400'>Sign up</Text>
                </Pressable>
            </View>
            <Text style={{ color: dk ? '#6b7280' : '#9ca3af' }} className="text-center text-xs mt-8">
                By continuing, you agree to our Terms of Service and Privacy Policy.
            </Text>

        </SafeAreaView>
    )
}
