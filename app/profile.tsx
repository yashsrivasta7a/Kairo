import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const ProfilePage = () => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setError(null);
    try {
      await user.update({ firstName: firstName.trim(), lastName: lastName.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update name');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  if (!isLoaded) return null;

  const email = user?.primaryEmailAddress?.emailAddress ?? 'No email';

  return (
    <LinearGradient
      colors={['#0d031fff', '#000000']}
      start={{ x: 0.09, y: 0.09 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 px-6">
        <View className="flex-row items-center justify-between py-3 mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-1 -ml-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white flex-1 text-center">Profile</Text>
          <TouchableOpacity
            className={`rounded-xl px-4 py-2 ${isSaving ? 'bg-[#6D28D9]/60' : 'bg-[#6D28D9]'}`}
            onPress={handleSave}
            disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="font-semibold text-white">Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="items-center mb-8">
            <View className="relative p-1 rounded-full border-2 border-purple-500">
              {user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  className="w-24 h-24 rounded-full"
                  accessibilityLabel="Profile picture"
                />
              ) : (
                <View
                  className="w-24 h-24 rounded-full bg-white/10 items-center justify-center"
                  style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                  <Ionicons name="person" size={48} color="#a1a1aa" />
                </View>
              )}
            </View>
            <Text className="text-gray-400 text-sm mt-3">{email}</Text>
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-gray-300">First Name</Text>
            <TextInput
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white"
              placeholder="First name"
              placeholderTextColor="#9ca3af"
              value={firstName}
              onChangeText={setFirstName}
              editable={!isSaving}
            />
          </View>

          <View className="mb-6">
            <Text className="mb-2 text-sm font-medium text-gray-300">Last Name</Text>
            <TextInput
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white"
              placeholder="Last name"
              placeholderTextColor="#9ca3af"
              value={lastName}
              onChangeText={setLastName}
              editable={!isSaving}
            />
          </View>

          {error && (
            <Text className="text-red-400 text-sm mb-4">{error}</Text>
          )}

          <TouchableOpacity
            className="mt-6 w-full items-center rounded-xl py-3 bg-[#6D28D9] active:opacity-70"
            onPress={handleSignOut}>
            <Text className="font-semibold text-white">Sign out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ProfilePage;
