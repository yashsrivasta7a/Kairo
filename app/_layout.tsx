import * as WebBrowser from 'expo-web-browser';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Text, TextInput } from 'react-native';
import './global.css';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '../constants/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';
import { authClient } from '@/lib/auth-client';
import { convex } from '@/lib/convex';
import * as SplashScreen from 'expo-splash-screen';

WebBrowser.maybeCompleteAuthSession();
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors if splash was already prevented.
});

const queryClient = new QueryClient();

function RootNavigator() {
  const { data: session, isPending } = authClient.useSession();
  const hasHiddenSplash = useRef(false);
  const isLoggedIn = !!session?.user;

  useEffect(() => {
    if (!isPending && !hasHiddenSplash.current) {
      hasHiddenSplash.current = true;
      SplashScreen.hideAsync().catch(() => {
        // Ignore if splash is already hidden.
      });
    }
  }, [isPending]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen
          name="(auth)"
          options={{
            animation: 'none',
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen
          name="(tabs)"
          options={{
            animation: 'none',
          }}
        />
        <Stack.Screen name="(builder)" />
        <Stack.Screen name="profile" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      // @ts-ignore
      Text.defaultProps = Text.defaultProps || {};
      // @ts-ignore
      Text.defaultProps.style = { ...Text.defaultProps.style, fontFamily: 'DMSans_400Regular' };
      // @ts-ignore
      TextInput.defaultProps = TextInput.defaultProps || {};
      // @ts-ignore
      TextInput.defaultProps.style = {
        // @ts-ignore
        ...TextInput.defaultProps.style,
        fontFamily: 'DMSans_400Regular',
      };
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConvexBetterAuthProvider client={convex} authClient={authClient}>
        <ThemeProvider>
          <BottomSheetModalProvider>
            <QueryClientProvider client={queryClient}>
              <StatusBar hidden />
              <RootNavigator />
            </QueryClientProvider>
          </BottomSheetModalProvider>
        </ThemeProvider>
      </ConvexBetterAuthProvider>
    </GestureHandlerRootView>
  );
}
