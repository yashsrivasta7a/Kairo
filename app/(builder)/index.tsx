import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  TextInput,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';

import DropDown from 'components/DropDown';
import UserProfile from 'components/userProfile';
import db from 'lib/instant/client';
import { useCreateModalStore } from 'lib/store';

export default function CreateScreen() {

  const { appName, setAppName } = useCreateModalStore();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedBuild, setSelectedBuild] = useState(appName || '');

  // Fetch only this user's builds, filtered server-side
  const { data } = db.useQuery(
    user
      ? { builds: { $: { where: { 'owner.clerkId': user.id } } } }
      : null
  );

  const builds = (data?.builds ?? []).map((b: any) => ({
    label: b.slug || b.id || 'Build',
    value: b.id || '',
  }));

  useEffect(() => {
    if (builds.length && !selectedBuild) {
      setSelectedBuild(builds[0].value);
      setAppName?.(builds[0].label);
    }
  }, [data?.builds]);

  useEffect(() => {
    setAppName?.(selectedBuild);
  }, [selectedBuild]);

  if (!isLoaded) return null;

  const handleGenerate = async () => {
    if (!prompt || !selectedBuild) return;

    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          userId: user?.id,
          buildId: selectedBuild,
        }),
      });

      setIsGenerating(false);
      setPrompt('');

      if (response.ok) {
        const data = await response.json();
        router.push(`/(builder)/${data.buildId}`);
      }
    } catch (err) {
      setIsGenerating(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0d031fff', '#000000']}
      start={{ x: 0.09, y: 0.09 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1 px-4">
        <StatusBar barStyle="light-content" />
        <View className="flex-row items-center justify-between py-3">
          <View>
            <Text className="text-xs font-medium uppercase tracking-wider text-white/70">
              Builds
            </Text>
            <DropDown
              label="Select Build"
              items={builds}
              value={selectedBuild}
              onValueChange={setSelectedBuild}
            />
          </View>
          <UserProfile />
        </View>
        <View className="relative flex-1 justify-center">
          <TextInput
            className="min-h-[80px] w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 pr-16 text-white"
            placeholder="Describe your app..."
            placeholderTextColor="#9ca3af"
            value={prompt}
            multiline
            onChangeText={setPrompt}
            textAlignVertical="top"
          />

          <TouchableOpacity
            className={`absolute right-4 rounded-full p-4 ${
              isGenerating ? 'bg-[#6D28D9]/60' : 'bg-[#6D28D9]'
            }`}
            onPress={handleGenerate}
            disabled={isGenerating}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isGenerating ? 'hourglass-outline' : 'rocket-outline'}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}