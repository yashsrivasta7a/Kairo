import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { Tabs, useRouter } from 'expo-router'
import { View } from 'react-native'
import { useCreateModalStore } from '../../lib/store'
import Create from './create'


export default function TabsLayout() {
    const router = useRouter()
    const { open } = useCreateModalStore()

    return (
        <>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                            backgroundColor: 'transparent',
                            paddingHorizontal: 10,
                            marginHorizontal: 60,
                            bottom: 44,
                            left: 24,
                            right: 24,
                            height: 54,
                            borderRadius: 50,
                            position: 'absolute',
                            borderWidth: 1,
                            borderColor: 'rgba(124,58,237,0.12)',
                            elevation: 10,
                            shadowColor: '#7c3aed',
                            shadowOpacity: 0.08,
                            shadowRadius: 12,
                            shadowOffset: { width: 0, height: 6 },
                        },
                        tabBarBackground: () => (
                            <LinearGradient
                                colors={[ 'rgba(255,255,255,0.7)', 'rgba(244,236,255,0.6)' ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{
                                    flex: 1,
                                    borderRadius: 50,
                                    overflow: 'hidden',
                                }}>
                                <BlurView
                                    intensity={65}
                                    tint="light"
                                    style={{ flex: 1 }}
                                />
                            </LinearGradient>
                        ),
                        tabBarActiveTintColor: '#7c3aed',
                        tabBarInactiveTintColor: '#a1a1aa',
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="planet" size={size} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="create"
                    listeners={() => ({
                        tabPress: (e) => {
                            e.preventDefault();
                            open();
                        },
                    })}
                    options={{
                        tabBarLabel: () => null,
                        tabBarIcon: () => (
                            <View style={{ position: 'absolute', top: -25 }}>
                                <BlurView
                                    intensity={25}
                                    tint="dark"
                                    style={{
                                        overflow: 'hidden',
                                        height: 92,
                                        width: 92,
                                        borderRadius: 46,
                                        borderWidth: 1,
                                        borderColor: 'rgba(255, 255, 255, 0.15)',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                        <LinearGradient
                                            colors={['#6d28d9', '#7c3aed']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={{
                                                height: 76,
                                                width: 76,
                                                borderRadius: 38,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                borderWidth: 1,
                                                borderColor: 'rgba(124,58,237,0.12)'
                                            }}>
                                            <Ionicons name="logo-gitlab" size={28} color="white" />
                                        </LinearGradient>
                                </BlurView>
                            </View>
                        ),
                    }}
                />

                <Tabs.Screen
                    name="explore"
                    options={{
                        title: 'Community',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="globe-outline" size={size} color={color} />
                        ),
                    }}
                />
            </Tabs>

            <Create />
        </>
    )
}
