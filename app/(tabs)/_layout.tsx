import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
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
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        elevation: 10,
                        shadowColor: '#000',
                        shadowOpacity: 0.25,
                        shadowRadius: 12,
                        shadowOffset: { width: 0, height: 8 },
                    },
                    tabBarBackground: () => (
                        <BlurView
                            intensity={30}
                            tint="dark"
                            style={{
                                flex: 1,
                                borderRadius: 50,
                                overflow: 'hidden',
                            }}
                        />
                    ),
                    tabBarActiveTintColor: '#fff',
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
                                    <View
                                        style={{
                                            height: 76,
                                            width: 76,
                                            borderRadius: 38,
                                            backgroundColor: '#3c147dff',
                                            borderWidth: 1,
                                            borderColor: 'rgba(117, 111, 111, 0.4)',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <View className='relative'>
                                            <Ionicons
                                                name="logo-gitlab"
                                                size={28}
                                                color="white"
                                            />
                                        </View>

                                    </View>
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
