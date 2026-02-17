
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import './global.css';
import { ThemeProvider } from 'constants/ThemeContext';

export default function RootLayout() {
  return (
    <>
    <ThemeProvider>
      <StatusBar hidden />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
    </>
  );
}
