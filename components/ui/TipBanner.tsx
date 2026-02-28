import React, { useRef, useEffect, useState } from 'react'
import { View, Animated } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useColorScheme } from 'nativewind'

const TIPS = [
  'Build like you\'re funded.',
  'Deploy instantly — no servers, no config.',
  'Share a link. Anyone can use your app.',
  'Describe it. AI builds it in seconds.',
]

export default function TipBanner() {
  const { colorScheme } = useColorScheme()
  const dk = colorScheme === 'dark'
  const [i, setI] = useState(0)
  const opacity = useRef(new Animated.Value(1)).current
  const pulse = useRef(new Animated.Value(1)).current

  // Dot pulse loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.5, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  // Tip rotation — fade only, no pop
  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
        setI(x => (x + 1) % TIPS.length)
        Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }).start()
      })
    }, 3800)
    return () => clearInterval(id)
  }, [])

  return (
    <Animated.View
      style={{
        marginBottom: 14,
        shadowColor: '#7c3aed',
        shadowOpacity: 0.22,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
      }}>
      <LinearGradient
        colors={dk ? ['#1e0a3c', '#2a1155', '#1e0a3c'] : ['#ede0ff', '#e4d4ff', '#dac7ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: 999,
          paddingHorizontal: 16,
          paddingVertical: 9,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderWidth: 1,
          borderColor: dk ? 'rgba(124,58,237,0.35)' : 'rgba(124,58,237,0.2)',
          width: '100%'
        }}>
        {/* Pulsing dot */}
        <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={{
              position: 'absolute',
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: 'rgba(124,58,237,0.2)',
              transform: [{ scale: pulse }],
            }}
          />
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#7c3aed' }} />
        </View>

        <Animated.Text
          style={{
            fontFamily: 'DMSans_500Medium',
            fontSize: 13.5,
            color: dk ? '#d8b4fe' : '#3b0764',
            opacity,
            letterSpacing: -0.1,
          }}>
          {TIPS[i]}
        </Animated.Text>
      </LinearGradient>
    </Animated.View>
  )
}

