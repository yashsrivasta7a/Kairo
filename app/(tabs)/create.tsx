import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import React from 'react';
import { useCreateModalStore } from '../../lib/store';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function Create() {
  const { isOpen, close, appName, setAppName, setBuildId, isCreating, setIsCreating } = useCreateModalStore();
  const createBuild = useMutation(api.builds.create);

  const handleCreate = async () => {
    if (!appName.trim()) return;

    setIsCreating(true);
    try {
      const { buildId } = await createBuild({ appName: appName.trim() });
      setBuildId(buildId);
      close();
      router.push(`/(builder)/${buildId}`);
    } catch (err) {
      console.error('Failed to create build:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal animationType="fade" transparent={true} visible={isOpen} onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <TouchableWithoutFeedback onPress={close}>
          <View className="flex-1 items-center justify-center bg-black/50 px-4">
            <TouchableWithoutFeedback>
              <BlurView
                intensity={50}
                experimentalBlurMethod="dimezisBlurView"
                tint="dark"
                style={{
                  width: '100%',
                  maxWidth: 360,
                  borderRadius: 16,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                  
                }}>
                <View style={{ padding: 24 }}>
                  <Text className="mb-2 text-xl font-bold text-white">Name your App</Text>

                  <Text className="mb-5 text-sm text-gray-400">
                    Give your new application a name to get started.
                  </Text>

                  <View className="mb-6">
                    <Text className="mb-2 text-sm font-medium text-gray-300">Application Name</Text>

                    <TextInput
                      className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                      placeholder="e.g. My Awesome App"
                      placeholderTextColor="#9ca3af"
                      value={appName}
                      onChangeText={setAppName}
                      autoFocus
                    />
                  </View>

                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      className="flex-1 items-center rounded-xl bg-white/10 py-3"
                      onPress={close}>
                      <Text className="font-semibold text-gray-300">Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className={`flex-1 items-center rounded-xl py-3 ${
                        isCreating || !appName.trim() ? 'bg-[#6D28D9]/50' : 'bg-[#6D28D9]'
                      }`}
                      onPress={handleCreate}
                      disabled={isCreating || !appName.trim()}>
                      {isCreating ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text className="font-semibold text-white">Create</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </BlurView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
