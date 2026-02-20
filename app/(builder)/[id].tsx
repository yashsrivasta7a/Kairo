import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicatorComponent,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import DropDown from 'components/DropDown';
import UserProfile from 'components/userProfile';
import CodeViewer from 'components/CodeViewer';
import { useBuilds } from 'lib/instant/useBuilds';
import { useCreateModalStore } from 'lib/store';

export default function BuildScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appName, setAppName } = useCreateModalStore();
  const { builds, userId } = useBuilds();
  const router = useRouter();

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedBuild, setSelectedBuild] = useState(id || '');

  const currentBuild = builds.find((build: any) => build.id === id);

  const buildOptions = builds.map((b: any) => ({
    label: b.slug || b.id || 'Build',
    value: b.id || '',
  }));

  useEffect(() => {
    if (buildOptions.length && !selectedBuild) {
      setSelectedBuild(buildOptions[0].value);
      setAppName?.(buildOptions[0].label);
    }
  }, [builds]);

  const handleGenerate = async () => {
    if (!prompt || !id) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, userId, buildId: id }),
      });

      setPrompt('');
      if (res.ok) {
        const data = await res.json();
        router.push(`/(builder)/${data.buildId}`);
      }
    } catch (err) {
      new Error('Generation failed');
    } finally {
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

        <View className="flex-row items-center justify-between py-3">
          <View>
            <Text className="text-xs font-medium uppercase tracking-wider text-white/70">
              Builds
            </Text>
            <DropDown
              label="Select Build"
              items={builds}
              value={selectedBuild}
              onValueChange={(val) => {
                setSelectedBuild(val);
                if (val && val !== id) {
                  router.replace(`/(builder)/${val}`);
                }
              }}
            />
          </View>
          <UserProfile />
        </View>
        <View className='flex-1 gap-1'>

         {currentBuild && (
             <View className="mt-4 flex-[2] rounded-xl border border-white/10 bg-white/5">
            <View className="flex-row items-center justify-between border-b border-white/10 px-4 py-2">
              <Text className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Generated Code
              </Text>
              <View className="flex-row items-center gap-2">
                {currentBuild.streaming === 'true' && (
                    <View className="flex-row items-center gap-1">
                    <ActivityIndicatorComponent size="small" color="#8B5CF6" />
                    <Text className="text-xs text-purple-400">Streaming...</Text>
                  </View>
                )}
                <View
                  className={`rounded-full px-2 py-0.5 ${
                      currentBuild.status === 'completed'
                      ? 'bg-green-900/50'
                      : currentBuild.status === 'failed'
                      ? 'bg-red-900/50'
                      : currentBuild.status === 'generating'
                      ? 'bg-purple-900/50'
                      : 'bg-gray-800'
                    }`}
                >
                  <Text
                    className={`text-xs ${
                        currentBuild.status === 'completed'
                        ? 'text-green-400'
                        : currentBuild.status === 'failed'
                        ? 'text-red-400'
                        : currentBuild.status === 'generating'
                        ? 'text-purple-400'
                        : 'text-gray-400'
                    }`}
                    >
                    {currentBuild.status || 'idle'}
                  </Text>
                </View>
              </View>
            </View>
            <ScrollView className="flex-1 p-4">
              {currentBuild.code ? (
                  <Text className="font-mono text-xs leading-5 text-green-300">
                  {currentBuild.code}
                </Text>
              ) : (
                <Text className="text-sm text-gray-500">
                  No code generated yet. Enter a prompt and hit generate.
                </Text>
              )}
            </ScrollView>
          </View>
        )}
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

              </View>
       
      </SafeAreaView>


    </LinearGradient>
  );
}