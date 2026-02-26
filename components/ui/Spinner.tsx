import React, { useRef, useEffect } from 'react'
import { Animated } from 'react-native'

export default function Spinner() {
  const r = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(Animated.timing(r, { toValue: 1, duration: 800, useNativeDriver: true })).start()
  }, [])
  const rotate = r.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
  return (
    <Animated.View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2.5, borderColor: '#2d1060', borderTopColor: '#a78bfa', transform: [{ rotate }] }} />
  )
}
