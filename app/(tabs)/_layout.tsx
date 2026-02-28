import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { Tabs, useRouter } from 'expo-router'
import { View } from 'react-native'
import { useColorScheme } from 'nativewind'
import { useCreateModalStore } from '../../lib/store'
import Create from './create'

function TabBarBg() {
    const { colorScheme } = useColorScheme();
    const dk = colorScheme === 'dark';
    return (
        <LinearGradient
            colors={dk
                ? ['rgba(13,3,31,0.85)', 'rgba(43,17,87,0.8)']
                : ['rgba(255,255,255,0.82)', 'rgba(244,236,255,0.75)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, borderRadius: 50, overflow: 'hidden' }}>
            <BlurView
                intensity={65}
                tint={dk ? 'dark' : 'light'}
                style={{ flex: 1 }}
            />
        </LinearGradient>
    );
}


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
                            marginHorizontal: 70,
                            bottom: 48,
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
                    tabBarBackground: () => <TabBarBg />,
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
                            <View style={{ position: 'absolute', top: -18 }}>
                                <LinearGradient
                                    colors={['#3b0764', '#6d28d9', '#7c3aed']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{
                                        overflow: 'hidden',
                                        height: 78,
                                        width: 78,
                                        borderRadius: 44,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        shadowColor: '#3b0764',
                                        shadowOpacity: 0.55,
                                        shadowRadius: 14,
                                        shadowOffset: { width: 0, height: 6 },
                                        elevation: 12,
                                        borderWidth: 2,
                                        borderColor: 'rgba(255,255,255,0.25)',
                                    }}>
                                        <Ionicons name="logo-gitlab" size={28} color="white" />
                                </LinearGradient>
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
