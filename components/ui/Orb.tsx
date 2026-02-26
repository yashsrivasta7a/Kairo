import React from 'react'
import { View } from 'react-native'

export default function Orb({ x, y, color, size, opacity = 0.2 }: { x: number; y: number; color: string; size: number; opacity?: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity }} />
  )
}
