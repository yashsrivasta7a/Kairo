import React, { useRef } from 'react'
import { View, TouchableOpacity, Animated } from 'react-native'
import { BlurView } from 'expo-blur'
import { useColorScheme } from 'nativewind'

interface GlowCardProps {
  children: React.ReactNode
  style?: object
  onPress?: () => void
  glowColor?: string
  glowOpacity?: number
  innerBg?: string
  noPad?: boolean
  pad?: number
}

export default function GlowCard({
  children,
  style,
  onPress,
  glowColor = '#7c3aed',
  glowOpacity = 0.3,
  innerBg,
  noPad = false,
  pad = 14,
}: GlowCardProps) {
  const { colorScheme } = useColorScheme()
  const dk = colorScheme === 'dark'
  const bg = innerBg ?? (dk ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)')
  const scale = useRef(new Animated.Value(1)).current
  const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 60, bounciness: 3 }).start()
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 3 }).start()
  const Wrap: any = onPress ? TouchableOpacity : View
  const wrapProps = onPress ? { onPress, onPressIn: pressIn, onPressOut: pressOut, activeOpacity: 1 } : {}

  return (
    <Wrap {...wrapProps} style={[{ borderRadius: 20, overflow: 'hidden' }, style]}>
      <Animated.View style={{ flex: 1, transform: [{ scale }], shadowColor: glowColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: glowOpacity, shadowRadius: 16, elevation: 6 }}>
        <BlurView intensity={30} tint={dk ? 'dark' : 'light'} style={{ flex: 1, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: dk ? 'rgba(124,58,237,0.22)' : 'rgba(124,58,237,0.13)' }}>
          <View style={{ flex: 1, backgroundColor: bg, padding: noPad ? 0 : pad }}>{children}</View>
        </BlurView>
      </Animated.View>
    </Wrap>
  )
}
