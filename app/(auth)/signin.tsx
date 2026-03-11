import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { authClient } from '@/lib/auth-client';

export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

export default function Page() {
  useWarmUpBrowser();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const dk = colorScheme === 'dark';

  const handleSignIn = async () => {
    const res = await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/',
    });
    console.log(JSON.stringify(res.data));
    // if (error) {
    //   console.log(error);
    //   return;
    // }
    const { data } = await authClient.getSession();
    if (data) {
      console.log(JSON.stringify(data));
      router.replace('/');
    } else {
      console.error('Better Auth done fucked up');
      console.log(data);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: dk ? '#000000' : '#f5f3ff',
        paddingHorizontal: 24,
        justifyContent: 'center',
      }}>
      <View className="mb-7 items-center">
        <Text style={{ color: dk ? 'white' : '#3b0764' }} className="mb-2 text-3xl font-bold">
          Welcome Back
        </Text>
        <Text style={{ color: dk ? '#9ca3af' : '#6b7280' }} className="text-center text-base">
          Sign in to Kairo to continue building
        </Text>
      </View>

      <Pressable
        onPress={handleSignIn}
        className="mb-4 h-12 w-full flex-row items-center justify-center rounded-lg bg-white active:opacity-90">
        <Ionicons name="logo-google" size={20} color="black" style={{ marginRight: 10 }} />
        <Text className="text-base font-medium text-black">Continue With Google</Text>
      </Pressable>

      <Pressable
        onPress={handleSignIn}
        style={{
          backgroundColor: dk ? '#171717' : '#24292e',
          borderColor: dk ? '#2a2a2a' : '#1b1f23',
        }}
        className="mb-4 h-12 w-full flex-row items-center justify-center rounded-lg border active:opacity-90">
        <Ionicons name="logo-github" size={20} color="white" style={{ marginRight: 10 }} />
        <Text className="text-base font-medium text-white">Continue with GitHub</Text>
      </Pressable>

      <Text style={{ color: dk ? '#6b7280' : '#9ca3af' }} className="mt-8 text-center text-xs">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </Text>
    </SafeAreaView>
  );
}
