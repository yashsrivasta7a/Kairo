import React, { useState, useEffect } from 'react'
import { Text } from 'react-native'

export default function CountUp({ to, style }: { to: number; style?: object }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(0)
    if (to === 0) return
    let v = 0
    const step = Math.max(1, Math.ceil(to / 20))
    const id = setInterval(() => {
      v = Math.min(v + step, to)
      setN(v)
      if (v >= to) clearInterval(id)
    }, 40)
    return () => clearInterval(id)
  }, [to])
  return (
    <Text style={[{ fontFamily: 'DMSans_700Bold', fontSize: 36, color: '#3b0764' }, style]}>
      {n}
    </Text>
  )
}
