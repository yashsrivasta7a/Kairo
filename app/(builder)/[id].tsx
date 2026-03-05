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
  Switch,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';

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
  const [lastPrompt, setLastPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { colorScheme } = useColorScheme();
  const dk = colorScheme === 'dark';

  const stageLabel: Record<string, string> = {
    specs: '🧠 Planning your app...',
    screens: '✏️ Writing screens...',
    gluing: '🔧 Putting it together...',
    completed: '✅ Ready',
    failed: '❌ Failed',
  };

  useEffect(() => {
    if (!routeBuildId && options.length) {
      router.replace(`/(builder)/${options[0].value}`);
    }
  }, [routeBuildId, options, router]);

  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [localPublic, setLocalPublic] = useState<boolean | null>(null);

  const currentBuild = builds.find((b: any) => b.id === routeBuildId);
  const effectivePublic = currentBuild ? (localPublic ?? currentBuild.public) : false;

  useEffect(() => {
    // Reset local override when switching between builds
    setLocalPublic(null);
    setIsUpdatingVisibility(false);
  }, [currentBuild?.id]);

  const handleTogglePublic = async () => {
    if (!currentBuild?.id || currentBuild.status !== 'completed' || isUpdatingVisibility) return;
    if (!userId) return;

    const nextValue = !effectivePublic;
    // Optimistic update: flip immediately in the UI
    setLocalPublic(nextValue);
    setIsUpdatingVisibility(true);

    try {
      const res = await fetch('/api/toggle-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildId: currentBuild.id,
          userId,
          public: nextValue,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error('Failed to toggle public visibility', body);
        // Revert optimistically-updated value on failure
        setLocalPublic(!!currentBuild.public);
      }
    } catch (err) {
      console.error('Failed to toggle public visibility', err);
      setLocalPublic(!!currentBuild.public);
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt || !routeBuildId) return;
    setIsGenerating(true);
    setLastPrompt(prompt); // save before clearing so retry can reuse it

    try {
      await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, userId, buildId: routeBuildId }),
      });
      setPrompt('');
    } catch (err) {
      console.error('Generation failed', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetry = async () => {
    if (!lastPrompt || !routeBuildId) return;
    setIsGenerating(true);

    try {
      await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: lastPrompt, userId, buildId: routeBuildId }),
      });
    } catch (err) {
      console.error('Retry failed', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <LinearGradient
      colors={dk ? ['#0d031f', '#000000', '#2b1157'] : ['#f5f3ff', '#ffffff', '#ede9fe']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 px-4">
        <View className="flex-row items-center justify-between">
          <View className="mr-3 flex-1">
            <Text
              style={{ color: dk ? 'rgba(255,255,255,0.7)' : '#7c3aed' }}
              className="text-xs font-medium uppercase tracking-wider">
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
        <KeyboardAvoidingView behavior="padding" className="flex-1 ">
          <View className="flex-1 gap-0">
            {currentBuild && (
              <View
                style={{
                  flex: 1,
                  marginTop: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  backgroundColor: dk ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottomWidth: 1,
                    borderBottomColor: dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                  }}>
                  <Text
                    style={{ color: dk ? 'rgba(255,255,255,0.6)' : '#7c3aed' }}
                    className="text-xs font-semibold uppercase tracking-wider">
                    Generated Code
                  </Text>
                  <View className="flex-row items-center gap-2">
                    {currentBuild.status === 'failed' && (
                      <TouchableOpacity
                        onPress={handleRetry}
                        className="rounded-lg bg-red-900/50 px-2 py-1">
                        <Text className="text-xs text-red-400">↺ Retry</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => setShowPreview(true)}
                      className="rounded-lg bg-[#fb9262ff] px-2 py-1"
                      activeOpacity={0.8}>
                      <Text style={{ color: dk ? 'white' : '#3b0764' }} className="text-xs">
                        Preview
                      </Text>
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
                    <View className="flex-row items-center gap-1 ml-1">
                      <Ionicons
                        name="globe-outline"
                        size={14}
                        color={
                          effectivePublic
                            ? dk
                              ? '#a78bfa'
                              : '#6d28d9'
                            : dk
                              ? 'rgba(148,163,184,0.8)'
                              : 'rgba(148,163,184,0.9)'
                        }
                      />
                      <Switch
                        value={!!effectivePublic}
                        onValueChange={handleTogglePublic}
                        disabled={
                          currentBuild.status !== 'completed' || isUpdatingVisibility
                        }
                        thumbColor={effectivePublic ? '#f9fafb' : '#e5e7eb'}
                        trackColor={{
                          false: dk ? 'rgba(31,41,55,0.9)' : 'rgba(209,213,219,1)',
                          true: dk ? '#4c1d95' : '#7c3aed',
                        }}
                      />
                    </View>
                  </View>
                </View>
                <ScrollView className="flex-1 p-4">
                  {currentBuild.code ? (
                    <Text
                      style={{ color: dk ? '#86efac' : '#15803d' }}
                      className="font-mono text-xs leading-5">
                      {currentBuild.code}
                    </Text>
                  ) : currentBuild.status === 'generating' ? (
                    <View className="flex-row items-center gap-1">
                      <ActivityIndicator size="small" color="#8B5CF6" />
                      <Text className="text-xs text-purple-400">
                        {stageLabel[currentBuild.stage ?? ''] || 'Generating...'}
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ color: dk ? '#6b7280' : '#9ca3af' }} className="text-sm">
                      No code generated yet. Enter a prompt and hit generate.
                    </Text>
                  )}
                </ScrollView>
              </View>
            )}
            <View className="relative mt-2">
              <TextInput
                style={{
                  borderColor: dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  backgroundColor: dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                  color: dk ? 'white' : '#1a1a2e',
                }}
                className="min-h-[80px] w-full rounded-xl border px-4 py-4 pr-16"
                placeholder="Describe your app..."
                placeholderTextColor={dk ? '#9ca3af' : '#9ca3af'}
                value={prompt}
                multiline
                onChangeText={setPrompt}
                textAlignVertical="top"
              />

              <TouchableOpacity
                className={`absolute bottom-4 right-4 rounded-full p-4 ${
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
              <SafeAreaView style={{ flex: 1, backgroundColor: dk ? '#09090f' : '#f5f3ff' }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: dk ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
                  }}>
                  <Text
                    style={{ color: dk ? 'white' : '#1a1a2e' }}
                    className="text-sm font-semibold">
                    Preview
                  </Text>
                  <Pressable onPress={() => setShowPreview(false)}>
                    <Text style={{ color: dk ? '#a78bfa' : '#7c3aed' }} className="text-sm">
                      Close
                    </Text>
                  </Pressable>
                </View>
                <View style={{ flex: 1 }}>
                  {currentBuild?.status === 'completed' && currentBuild?.instantId ? (
                    <BuildUi code={currentBuild.code} instantAppId={currentBuild.instantId} />
                  ) : (
                    <View className="flex-1 items-center justify-center px-4">
                      <Ionicons
                        name="code-slash-outline"
                        size={48}
                        color={dk ? '#9ca3af' : '#6b7280'}
                      />
                      <Text
                        style={{ color: dk ? '#6b7280' : '#4b5563' }}
                        className="mt-4 text-center text-base">
                        {`Code isn't generated yet`}
                      </Text>
                      <Text
                        style={{ color: dk ? '#9ca3af' : '#6b7280' }}
                        className="mt-2 text-center text-sm">
                        Please wait for the generation to complete
                      </Text>
                    </View>
                  )}
                </View>
              </SafeAreaView>
            </Modal>
          </View>
          <Text
            numberOfLines={3}
            style={{ color: dk ? '#9ca3af' : '#9ca3af' }}
            className="align-center text- mt-2 text-center text-xs">
            Kairo works best with short, focused prompts.{' '}
          </Text>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
