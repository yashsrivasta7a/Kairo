import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from 'nativewind';

const GlassCard = ({
  children,
  className: cn,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const { colorScheme } = useColorScheme();
  const dk = colorScheme === 'dark';
  return (
    <BlurView
      intensity={55}
      tint={dk ? 'dark' : 'light'}
      className={`overflow-hidden rounded-2xl border ${dk ? 'border-white/[0.08]' : 'border-black/[0.06]'} ${cn ?? ''}`}>
      {children}
    </BlurView>
  );
};

const OptionRow = ({
  icon,
  label,
  value,
  onPress,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  color?: string;
}) => {
  const { colorScheme } = useColorScheme();
  const dk = colorScheme === 'dark';
  const resolvedColor = color ?? (dk ? '#ffffff' : '#1a1a2e');
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} className="flex-row items-center py-3">
      <View className="h-[34px] w-[34px] items-center justify-center rounded-full bg-[rgba(109,40,217,0.25)]">
        <Ionicons name={icon} size={18} color={resolvedColor} />
      </View>
      <View className="ml-3 flex-1">
        <Text style={{ color: resolvedColor }} className="text-sm font-medium">
          {label}
        </Text>
        {value ? (
          <Text style={{ color: dk ? '#6b7280' : '#9ca3af' }} className="mt-0.5 text-xs">
            {value}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={dk ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'} />
    </TouchableOpacity>
  );
};

const ProfilePage = () => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const { colorScheme } = useColorScheme();
  const dk = colorScheme === 'dark';

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
    setSuccessMsg(null);
    try {
      await user.update({ firstName: firstName.trim(), lastName: lastName.trim() });
      setSuccessMsg('Profile updated');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update name');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePhoto = async () => {
    if (!user) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      try {
        const asset = result.assets[0];
        const base64 = asset.base64;
        const mimeType = asset.mimeType ?? 'image/jpeg';
        if (base64) {
          await user.setProfileImage({ file: `data:${mimeType};base64,${base64}` });
          setSuccessMsg('Profile photo updated');
          setTimeout(() => setSuccessMsg(null), 2500);
        }
      } catch (err) {
        Alert.alert('Error', 'Could not update photo. Try again.');
      }
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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your data, builds, and projects will be lost forever.\n\nAre you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await user?.delete();
              router.replace('/');
            } catch (err) {
              Alert.alert('Error', 'Could not delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (!isLoaded) return null;

  const email = user?.primaryEmailAddress?.emailAddress ?? 'No email';
  const createdAt = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <LinearGradient
      colors={dk ? ['#0d031f', '#000000', '#2b1157'] : ['#f5f3ff', '#ffffff', '#ede9fe']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={22} color={dk ? 'white' : '#3b0764'} />
          </TouchableOpacity>
          <Text style={{ color: dk ? 'white' : '#3b0764' }} className="flex-1 text-center text-lg font-bold">Profile</Text>
          <TouchableOpacity
            className="rounded-lg px-4 py-2"
            style={{
              backgroundColor: isSaving ? 'rgba(109,40,217,0.4)' : '#6D28D9',
            }}
            onPress={handleSave}
            disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-sm font-semibold text-white">Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}>
          <View className="mb-8 mt-4 items-center">
            <TouchableOpacity activeOpacity={0.8} onPress={handleChangePhoto}>
              <View className=" rounded-full border-2 border-purple-500 p-1 shadow-lg shadow-white/100">
                {user?.imageUrl ? (
                  <Image
                    source={{ uri: user.imageUrl }}
                    className="h-[110px] w-[110px] rounded-full"
                    accessibilityLabel="Profile picture"
                  />
                ) : (
                  <View className="h-[110px] w-[110px] items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.06]">
                    <Ionicons name="person" size={48} color="#a1a1aa" />
                  </View>
                )}

                <View className="absolute bottom-1 right-1 h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-[#0d031f] bg-[#6D28D9]">
                  <Ionicons name="camera" size={14} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>

            <Text style={{ color: dk ? 'white' : '#3b0764' }} className="mt-4 text-xl font-bold">
              {user?.fullName || `${firstName} ${lastName}`.trim() || 'Your Name'}
            </Text>
            <Text style={{ color: dk ? '#9ca3af' : '#6b7280' }} className="mt-1 text-sm">{email}</Text>
            {createdAt && (
              <Text className="mt-1 text-xs text-gray-600">Member since {createdAt}</Text>
            )}
          </View>

          {error && (
            <View
              className="mb-3 rounded-xl px-4 py-2"
              style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}>
              <Text className="text-sm text-red-400">{error}</Text>
            </View>
          )}
          {successMsg && (
            <View
              className="mb-3 rounded-xl px-4 py-2"
              style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}>
              <Text className="text-sm text-green-400">{successMsg}</Text>
            </View>
          )}

          <Text className="mb-2 ml-1 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Personal Info
          </Text>
          <GlassCard>
            <View className="px-4 pb-2 pt-4">
              <Text style={{ color: dk ? '#9ca3af' : '#6b7280' }} className="mb-1 text-xs font-medium">First Name</Text>
              <TextInput
                style={{
                  borderColor: dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
                  backgroundColor: dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  color: dk ? '#ffffff' : '#1a1a2e',
                }}
                className="mb-3 w-full rounded-xl border px-4 py-3"
                placeholder="First name"
                placeholderTextColor={dk ? '#555' : '#9ca3af'}
                value={firstName}
                onChangeText={setFirstName}
                editable={!isSaving}
              />

              <Text style={{ color: dk ? '#9ca3af' : '#6b7280' }} className="mb-1 text-xs font-medium">Last Name</Text>
              <TextInput
                style={{
                  borderColor: dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
                  backgroundColor: dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  color: dk ? '#ffffff' : '#1a1a2e',
                }}
                className="mb-1 w-full rounded-xl border px-4 py-3"
                placeholder="Last name"
                placeholderTextColor={dk ? '#555' : '#9ca3af'}
                value={lastName}
                onChangeText={setLastName}
                editable={!isSaving}
              />
            </View>
          </GlassCard>

          <Text className="mb-2 ml-1 mt-6 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Account
          </Text>
          <GlassCard>
            <View className="px-4 py-2">
              <OptionRow
                icon="camera-outline"
                label="Change Photo"
                value="Pick a new avatar"
                onPress={handleChangePhoto}
              />
              <OptionRow icon="time-outline" label="Member Since" value={createdAt ?? '—'} />
            </View>
          </GlassCard>

          <Text className="mb-2 ml-1 mt-6 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Actions
          </Text>
          <GlassCard>
            <View className="px-4 py-2">
              <OptionRow icon="log-out-outline" label="Sign Out" onPress={handleSignOut} />
              <OptionRow
                icon="trash-outline"
                label="Delete Account"
                value="Permanently remove your data"
                onPress={handleDeleteAccount}
                color="#ef4444"
              />
            </View>
          </GlassCard>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ProfilePage;
