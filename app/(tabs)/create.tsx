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
  StyleSheet,
} from 'react-native';
import React from 'react';
import { useCreateModalStore } from '../../lib/store';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useColorScheme } from 'nativewind';

export default function Create() {
  const { isOpen, close, appName, setAppName, setBuildId, isCreating, setIsCreating } = useCreateModalStore();
  const { user } = useUser();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const overlayClass = isDark ? 'bg-black/50' : 'bg-white/30';
  const blurTint = isDark ? 'dark' : 'light';
  const blurBorderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
  const headingClass = isDark ? 'text-white' : 'text-slate-900';
  const descClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const labelClass = isDark ? 'text-gray-300' : 'text-gray-700';
  const inputBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)';
  const inputTextColor = isDark ? '#fff' : '#0f172a';

  const handleCreate = async () => {
    if (!appName.trim() || !user?.id) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/create-build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, appName: appName.trim() }),
      });

      if (response.ok) {
        const { buildId, slug } = await response.json();
        setBuildId(buildId);
        close();
        router.push(`/(builder)/${buildId}`);
      }
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
          <View className={`flex-1 items-center justify-center px-4 ${overlayClass}`}>
            {/* full-screen background blur behind the modal card */}
            <BlurView
              intensity={10}
              experimentalBlurMethod="dimezisBlurView"
              tint={blurTint}
              style={[StyleSheet.absoluteFill, { zIndex: 0 }]}
              pointerEvents="none"
            />
            <TouchableWithoutFeedback>
              <BlurView
                intensity={65}
                experimentalBlurMethod="dimezisBlurView"
                tint={blurTint}
                style={{
                  width: '100%',
                  maxWidth: 360,
                  borderRadius: 16,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: blurBorderColor,
                  zIndex: 1,
                }}>
                <View style={{ padding: 24 }}>
                  <Text className={`mb-2 text-xl font-bold ${headingClass}`}>Name your App</Text>

                  <Text className={`mb-5 text-sm ${descClass}`}>
                    Give your new application a name to get started.
                  </Text>

                  <View className="mb-6">
                    <Text className={`mb-2 text-sm font-medium ${labelClass}`}>Application Name</Text>

                    <TextInput
                      style={{
                        width: '100%',
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        backgroundColor: inputBg,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        color: inputTextColor,
                      }}
                      placeholder="e.g. My Awesome App"
                      placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                      value={appName}
                      onChangeText={setAppName}
                      autoFocus
                    />
                  </View>

                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        borderRadius: 16,
                        paddingVertical: 12,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
                      }}
                      onPress={close}>
                      <Text style={{ fontWeight: '600', color: isDark ? '#d1d5db' : '#374151' }}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        borderRadius: 16,
                        paddingVertical: 12,
                        backgroundColor: isCreating || !appName.trim() ? 'rgba(109,40,217,0.5)' : '#6D28D9'
                      }}
                      onPress={handleCreate}
                      disabled={isCreating || !appName.trim()}>
                      {isCreating ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={{ fontWeight: '600', color: '#fff' }}>Create</Text>
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
