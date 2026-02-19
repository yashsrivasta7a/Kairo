import { View, Text, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from 'react-native'
import React from 'react'
import { useCreateModalStore } from '../../lib/store'
import { BlurView } from 'expo-blur'


export default function Create() {
    const { isOpen, close, appName, setAppName } = useCreateModalStore()

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isOpen}
            onRequestClose={close}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <TouchableWithoutFeedback onPress={close}>
                    <View className="flex-1 justify-center items-center bg-black/50 px-4">
                        <TouchableWithoutFeedback>
                            <BlurView
                                intensity={125}
                                tint="dark"
                                style={{
                                    width: '100%',
                                    maxWidth: 360,
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                    borderWidth: 1,

                                    borderColor: 'rgba(255, 255, 255, 0.12)',
                                }}
                            >
                                <View style={{ padding: 24 }}>
                                    <Text className="text-xl font-bold text-white mb-2">
                                        Name your App
                                    </Text>

                                    <Text className="text-sm text-gray-400 mb-5">
                                        Give your new application a name to get started.
                                    </Text>

                                    <View className="mb-6">
                                        <Text className="text-sm font-medium text-gray-300 mb-2">
                                            Application Name
                                        </Text>

                                        <TextInput
                                            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white"
                                            placeholder="e.g. My Awesome App"
                                            placeholderTextColor="#9ca3af"
                                            value={appName}
                                            onChangeText={setAppName}
                                            autoFocus
                                        />
                                    </View>

                                    <View className="flex-row gap-3">
                                        <TouchableOpacity
                                            className="flex-1 py-3 rounded-xl bg-white/10 items-center"
                                            onPress={close}
                                        >
                                            <Text className="font-semibold text-gray-300">
                                                Cancel
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            className="flex-1 py-3 rounded-xl bg-[#6D28D9] items-center"
                                            onPress={() => {
                                                console.log('Create app:', appName)
                                                close()
                                            }}
                                        >
                                            <Text className="font-semibold text-white">
                                                Create
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </BlurView>

                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </Modal>
    )
}