import React, { useRef, useEffect } from 'react'
import { Animated } from 'react-native'

export default function Pulse({ color = '#7c3aed' }: { color?: string }) {
  const a = useRef(new Animated.Value(1)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 0.15, duration: 750, useNativeDriver: true }),
        Animated.timing(a, { toValue: 1, duration: 750, useNativeDriver: true }),
      ])
    ).start()
  }, [])
  return <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, opacity: a, marginRight: 5 }} />
}
