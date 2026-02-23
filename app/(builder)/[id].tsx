import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import DropDown from 'components/DropDown';
import UserProfile from 'components/userProfile';

import { useBuilds } from 'lib/instant/useBuilds';
import BuildUi from 'lib/buildUi';

export default function BuildScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const routeBuildId = Array.isArray(id) ? id[0] : id;
  const { builds, options, userId } = useBuilds();
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!routeBuildId && options.length) {
      router.replace(`/(builder)/${options[0].value}`);
    }
  }, [routeBuildId, options, router]);

  const currentBuild = builds.find((b: any) => b.id === routeBuildId);

  const handleGenerate = async () => {
    if (!prompt || !routeBuildId) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, userId, buildId: routeBuildId }),
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
      style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 px-4">
        <View className="flex-row items-center justify-between">
          <View className="mr-3 flex-1">
            <Text className="text-xs font-medium uppercase tracking-wider text-white/70">
              Builds
            </Text>
            <DropDown
              items={options}
              value={routeBuildId || options[0]?.value || ''}
              onValueChange={(val) => router.replace(`/(builder)/${val}`)}
            />
          </View>
          <UserProfile />
        </View>
        <KeyboardAvoidingView
          behavior="padding"
          className="flex-1 ">
          <View className="flex-1 gap-0">
            {currentBuild && (
              <View className="flex-1 mt-3 rounded-xl border border-white/10 bg-white/5">
                <View className="flex-row items-center justify-between border-b border-white/10 px-4 py-2">
                  <Text className="text-xs font-semibold uppercase tracking-wider text-white/60">
                    Generated Code
                  </Text>
                  <View className="flex-row items-center gap-2">
                    {currentBuild.streaming === 'true' && (
                      <View className="flex-row items-center gap-1">
                        <ActivityIndicator size="small" color="#8B5CF6" />
                        <Text className="text-xs text-purple-400">Streaming...</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      onPress={() => setShowPreview(true)}
                      className="rounded-lg px-2 py-1"
                      activeOpacity={0.8}>
                      <Text className="text-xs text-white">Preview</Text>
                    </TouchableOpacity>
                    <View
                      className={`rounded-full px-2 py-0.5 ${
                        currentBuild.status === 'completed'
                          ? 'bg-green-900/50'
                          : currentBuild.status === 'failed'
                            ? 'bg-red-900/50'
                            : currentBuild.status === 'generating'
                              ? 'bg-purple-900/50'
                              : 'bg-gray-800'
                      }`}>
                      <Text
                        className={`text-xs ${
                          currentBuild.status === 'completed'
                            ? 'text-green-400'
                            : currentBuild.status === 'failed'
                              ? 'text-red-400'
                              : currentBuild.status === 'generating'
                                ? 'text-purple-400'
                                : 'text-gray-400'
                        }`}>
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
            <View className="relative mt-2">
              <TextInput
                className="min-h-[80px] w-full rounded-xl border border-white/10 bg-white/10 px-4 py-4 pr-16 text-white"
                placeholder="Describe your app..."
                placeholderTextColor="#9ca3af"
                value={prompt}
                multiline
                onChangeText={setPrompt}
                textAlignVertical="top"
              />

              <TouchableOpacity
                className={`absolute right-4 bottom-4 rounded-full p-4 ${
                  isGenerating ? 'bg-[#6D28D9]/60' : 'bg-[#6D28D9]'
                }`}
                onPress={handleGenerate}
                disabled={isGenerating}
                activeOpacity={0.8}>
                <Ionicons
                  name={isGenerating ? 'hourglass-outline' : 'rocket-outline'}
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>

            <Modal
              key={showPreview ? 'preview-open' : 'preview-closed'}
              visible={showPreview}
              animationType="slide"
              onRequestClose={() => setShowPreview(false)}>
              <SafeAreaView style={{ flex: 1 }}>
              <View className="flex-row items-center justify-between px-4 py-3">
                <Text className="text-sm font-semibold text-black">Preview</Text>
                <Pressable onPress={() => setShowPreview(false)}>
                <Text className="text-sm text-black">Close</Text>
                </Pressable>
              </View>
              <View style={{ flex: 1 }}>
                {currentBuild?.status === 'completed' && currentBuild?.instantId ? (
                  <BuildUi code={currentBuild.code} instantAppId={currentBuild.instantId} />
                ) : (
                  <View className="flex-1 items-center justify-center px-4">
                  <Ionicons name="code-slash-outline" size={48} color="#9ca3af" />
                  <Text className="mt-4 text-center text-base text-gray-600">
                    Code isn't generated yet
                  </Text>
                  <Text className="mt-2 text-center text-sm text-gray-400">
                    Please wait for the generation to complete
                  </Text>
                  </View>
                )}
              </View>
              </SafeAreaView>
            </Modal>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
