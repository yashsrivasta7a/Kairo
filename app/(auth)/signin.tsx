import { authClient } from "@/lib/auth-client";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignInPage() {
  const { colorScheme } = useColorScheme();
  const dk = colorScheme === "dark";
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async (platform: "google" | "github") => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      // Clear stale local session state from previous interrupted auth attempts.
      await authClient.signOut().catch(() => {});
      await authClient.signIn.social({
        provider: platform,
        // Root now exists while logged out and redirects to /signin.
        callbackURL: "/",
      });
    } catch (error) {
      Alert.alert("Sign in failed", error instanceof Error ? error.message : "Please try again.");
      setIsSigningIn(false);
    }
  };

  return (
    <SafeAreaView className={`flex flex-1 ${dk ? "bg-[#000000]" : "bg-[#f5f3ff]"} justify-center px-6`}>
      <View className="mb-7 items-center">
        <Text className={`mb-2 text-3xl font-bold ${dk ? "text-white" : "text-[#3b0764]"}`}>Kairo</Text>
        <Text className={`text-center text-base ${dk ? "text-[#9ca3af]" : "text-[#6b7280]"}`}>
          {"Build like you're funded."}
        </Text>
      </View>

      {/* SIGN IN WITH GOOGLE */}
      <Pressable
        onPress={() => handleSignIn("google")}
        disabled={isSigningIn}
        className="mb-4 h-12 w-full flex-row items-center justify-center gap-2 rounded-lg bg-white active:opacity-90"
      >
        <Ionicons name="logo-google" size={20} color="black" />
        <Text className="text-base font-medium text-black">
          {isSigningIn ? "Connecting..." : "Continue With Google"}
        </Text>
      </Pressable>

      {/* SIGN IN WITH GITHUB */}
      <Pressable
        onPress={() => handleSignIn("github")}
        disabled={isSigningIn}
        className={`mb-4 h-12 w-full flex-row items-center justify-center gap-2 rounded-lg border active:opacity-90 ${
          dk ? "border-[#2a2a2a] bg-[#171717]" : "border-[#1b1f23] bg-[#24292e]"
        }`}
      >
        <Ionicons name="logo-github" size={20} color="white" />
        <Text className="text-base font-medium text-white">Continue with GitHub</Text>
      </Pressable>

      <Text className={`mt-8 text-center text-xs text-[${dk ? "#6b7280" : "#9ca3af"}]`}>
        By continuing, you agree to our <Link href="https://google.com">Terms of Service</Link> and{" "}
        <Link href="https://google.com">Privacy Policy</Link>.
      </Text>
    </SafeAreaView>
  );
}
