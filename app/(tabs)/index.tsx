import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    Animated,
    RefreshControl,
    StyleSheet,
} from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useUser } from '@clerk/clerk-expo'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useRouter } from 'expo-router'
import UserProfile from 'components/userProfile'
import { useBuilds } from '../../lib/instant/useBuilds'
import { useCreateModalStore } from '../../lib/store'

const { width: W } = Dimensions.get('window')
const GAP  = 8
const SIDE = 14

/* ─────────────────────────────────────────
   GLOW CARD
───────────────────────────────────────── */
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
function GlowCard({
    children, style, onPress,
    glowColor = '#7c3aed', glowOpacity = 0.3,
    innerBg = 'rgba(255,255,255,0.04)',
    noPad = false, pad = 14,
}: GlowCardProps) {
    const scale = useRef(new Animated.Value(1)).current
    const pressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 60, bounciness: 3 }).start()
    const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 40, bounciness: 3 }).start()
    const Wrap: any = onPress ? TouchableOpacity : View
    const wrapProps = onPress ? { onPress, onPressIn: pressIn, onPressOut: pressOut, activeOpacity: 1 } : {}

    return (
        <Wrap {...wrapProps} style={[{ borderRadius: 20, overflow: 'hidden' }, style]}>
            <Animated.View style={{
                flex: 1, transform: [{ scale }],
                shadowColor: glowColor, shadowOffset: { width: 0, height: 0 },
                shadowOpacity: glowOpacity, shadowRadius: 20, elevation: 8,
            }}>
                <BlurView intensity={20} tint="dark" style={{
                    flex: 1, borderRadius: 20, overflow: 'hidden',
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
                }}>
                    <View style={{ flex: 1, backgroundColor: innerBg, padding: noPad ? 0 : pad }}>
                        {children}
                    </View>
                </BlurView>
            </Animated.View>
        </Wrap>
    )
}

/* ─────────────────────────────────────────
   PULSE DOT
───────────────────────────────────────── */
function Pulse({ color }: { color: string }) {
    const a = useRef(new Animated.Value(1)).current
    useEffect(() => {
        Animated.loop(Animated.sequence([
            Animated.timing(a, { toValue: 0.15, duration: 750, useNativeDriver: true }),
            Animated.timing(a, { toValue: 1,    duration: 750, useNativeDriver: true }),
        ])).start()
    }, [])
    return <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, opacity: a, marginRight: 5 }} />
}

/* ─────────────────────────────────────────
   COUNT UP
───────────────────────────────────────── */
function CountUp({ to, style }: { to: number; style?: object }) {
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
    return <Text style={[s.bigNum, style]}>{n}</Text>
}

/* ─────────────────────────────────────────
   STATUS CHIP
───────────────────────────────────────── */
const STATUS: Record<string, { c: string; label: string }> = {
    done:     { c: '#34d399', label: 'Live'     },
    building: { c: '#fbbf24', label: 'Building' },
    error:    { c: '#f87171', label: 'Error'    },
}
function Chip({ status }: { status?: string }) {
    const { c, label } = STATUS[status ?? ''] ?? { c: '#71717a', label: 'Draft' }
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: `${c}26`, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 30 }}>
            <Pulse color={c} />
            <Text style={{ color: c, fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>{label}</Text>
        </View>
    )
}

/* ─────────────────────────────────────────
   BUILD ROW
───────────────────────────────────────── */
function BuildRow({ build, onPress, last }: { build: any; onPress: () => void; last: boolean }) {
    return (
        <TouchableOpacity onPress={onPress} style={{
            flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
            borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
            borderBottomColor: 'rgba(255,255,255,0.06)',
        }}>
            <View style={{
                width: 40, height: 40, borderRadius: 14,
                backgroundColor: 'rgba(124,58,237,0.2)', borderWidth: 1,
                borderColor: 'rgba(124,58,237,0.4)', justifyContent: 'center',
                alignItems: 'center', marginRight: 12,
            }}>
                <Ionicons name="cube-outline" size={16} color="#a78bfa" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={s.rowTitle} numberOfLines={1}>{build.slug || 'Untitled'}</Text>
                <Text style={s.rowSub}>
                    {build.updatedAt
                        ? new Date(build.updatedAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Jan 10, 2022'}
                </Text>
            </View>
            <Chip status={build.status} />
        </TouchableOpacity>
    )
}

/* ─────────────────────────────────────────
   TIP BANNER (pill, rotating)
───────────────────────────────────────── */
const TIPS = [
    '🔧  Describe your idea → AI builds it in seconds ✨',
    '🚀  Deploy instantly — no servers, no config',
    '🔗  Share a link. Anyone can use your app',
    '🎨  Remix public builds to create your own',
]
function TipBanner() {
    const [i, setI] = useState(0)
    const a = useRef(new Animated.Value(1)).current
    useEffect(() => {
        const id = setInterval(() => {
            Animated.timing(a, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
                setI(x => (x + 1) % TIPS.length)
                Animated.timing(a, { toValue: 1, duration: 300, useNativeDriver: true }).start()
            })
        }, 3600)
        return () => clearInterval(id)
    }, [])
    return (
        <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
            borderRadius: 30, paddingHorizontal: 18, paddingVertical: 11,
            marginBottom: 12,
        }}>
            <Animated.Text style={{ flex: 1, color: '#a1a1aa', fontSize: 12.5, fontFamily: 'Inter_400Regular', opacity: a }}>
                {TIPS[i]}
            </Animated.Text>
        </View>
    )
}

/* ─────────────────────────────────────────
   GREETING
───────────────────────────────────────── */
function getGreeting() {
    const h = new Date().getHours()
    if (h < 5)  return 'Late night 🌙'
    if (h < 12) return 'Good morning ☀️'
    if (h < 17) return 'Good afternoon 🌤'
    return 'Good evening 🌙'
}

/* ─────────────────────────────────────────
   AMBIENT ORB
───────────────────────────────────────── */
function Orb({ x, y, color, size, opacity = 0.2 }: { x: number; y: number; color: string; size: number; opacity?: number }) {
    return (
        <View pointerEvents="none" style={{
            position: 'absolute', left: x, top: y,
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: color, opacity,
        }} />
    )
}

/* ─────────────────────────────────────────
   SPINNER
───────────────────────────────────────── */
function Spinner() {
    const r = useRef(new Animated.Value(0)).current
    useEffect(() => {
        Animated.loop(Animated.timing(r, { toValue: 1, duration: 800, useNativeDriver: true })).start()
    }, [])
    const rotate = r.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
    return (
        <Animated.View style={{
            width: 26, height: 26, borderRadius: 13,
            borderWidth: 2.5, borderColor: '#2d1060', borderTopColor: '#a78bfa',
            transform: [{ rotate }],
        }} />
    )
}

/* ─────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────── */
function EmptyState({ onPress }: { onPress: () => void }) {
    return (
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <View style={{
                width: 44, height: 44, borderRadius: 15,
                backgroundColor: 'rgba(124,58,237,0.12)', borderWidth: 1,
                borderColor: 'rgba(124,58,237,0.25)', justifyContent: 'center',
                alignItems: 'center', marginBottom: 10,
            }}>
                <Ionicons name="rocket-outline" size={20} color="#7c3aed" />
            </View>
            <Text style={{ color: '#71717a', fontSize: 13, fontFamily: 'Inter_500Medium' }}>No apps yet</Text>
            <TouchableOpacity onPress={onPress} style={{ marginTop: 8 }}>
                <Text style={{ color: '#7c3aed', fontSize: 13, fontFamily: 'Inter_500Medium' }}>+ Create your first app</Text>
            </TouchableOpacity>
        </View>
    )
}

/* ─────────────────────────────────────────
   HOME SCREEN
───────────────────────────────────────── */
export default function HomeScreen() {
    const { user, isLoaded } = useUser()
    const router = useRouter()
    const { open } = useCreateModalStore()
    const { builds, isLoading } = useBuilds()
    const [refreshing, setRefreshing] = useState(false)

    const headerA = useRef(new Animated.Value(0)).current
    useEffect(() => {
        Animated.timing(headerA, { toValue: 1, duration: 600, useNativeDriver: true }).start()
    }, [])

    const recent   = [...builds].sort((a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 4)
    const total    = builds.length
    const deployed = builds.filter((b: any) => b.status === 'done').length
    const building = builds.filter((b: any) => b.status === 'building').length

    const half = (W - SIDE * 2 - GAP) / 2

    if (!isLoaded) return (
        <View style={{ flex: 1, backgroundColor: '#080808', justifyContent: 'center', alignItems: 'center' }}>
            <Spinner />
        </View>
    )

    return (
        <View style={{ flex: 1, backgroundColor: '#080808' }}>
            <StatusBar barStyle="light-content" />

            {/* Ambient orbs */}
            <Orb x={-80}      y={-60}  color="#6d28d9" size={300} opacity={0.18} />
            <Orb x={W - 120}  y={160}  color="#4338ca" size={220} opacity={0.13} />
            <Orb x={10}       y={560}  color="#5b21b6" size={200} opacity={0.11} />

            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: SIDE, paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1200) }}
                            tintColor="#7c3aed"
                        />
                    }
                >
                    {/* ══════════ HEADER ══════════ */}
                    <Animated.View style={{
                        flexDirection: 'row', alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        paddingTop: 8, paddingBottom: 14,
                        opacity: headerA,
                        transform: [{ translateY: headerA.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }],
                    }}>
                        <View>
                            <Text style={s.greet}>{getGreeting()}</Text>
                            <Text style={s.name}>{user?.firstName || 'Builder'}</Text>
                        </View>
                        <UserProfile />
                    </Animated.View>

                    {/* ══════════ TIP PILL ══════════ */}
                    <TipBanner />

                    {/* ══════════ ROW 1 — Stats bento ══════════ */}
                    <View style={{ flexDirection: 'row', gap: GAP, marginBottom: GAP }}>
                        {/* ── Total Apps (left, tall) ── */}
                        <GlowCard
                            style={{ width: half, height: 260 }}
                            glowColor="#7c3aed" glowOpacity={0.45}
                            innerBg="rgba(109,40,217,0.18)"
                        >
                            <View style={{ flex: 1, justifyContent: 'space-between' }}>
                                {/* Top row — icon + label */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <View style={[s.iconBox, { backgroundColor: 'rgba(167,139,250,0.14)', borderColor: 'rgba(167,139,250,0.22)' }]}>
                                        <Ionicons name="apps-sharp" size={16} color="#a78bfa" />
                                    </View>
                                    <Text style={{ color: 'rgba(167,139,250,0.5)', fontSize: 10, fontFamily: 'Inter_400Regular' }}>ALL TIME</Text>
                                </View>

                                {/* Big number */}
                                <View style={{ alignItems: 'flex-start' }}>
                                    <CountUp to={total} style={{ fontSize: 58, lineHeight: 60, letterSpacing: -2 }} />
                                    <Text style={[s.sublabel, { fontSize: 14, color: '#a1a1aa' }]}>Total Apps</Text>
                                </View>

                                {/* Progress bar + summary */}
                                <View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <Text style={{ color: '#71717a', fontSize: 10, fontFamily: 'Inter_400Regular' }}>Deployed</Text>
                                        <Text style={{ color: '#a78bfa', fontSize: 10, fontFamily: 'Inter_500Medium' }}>
                                            {total > 0 ? Math.round((deployed / total) * 100) : 0}%
                                        </Text>
                                    </View>
                                    <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 4 }}>
                                        <View style={{
                                            height: 4, borderRadius: 4,
                                            width: total > 0 ? `${Math.round((deployed / total) * 100)}%` : '0%',
                                            backgroundColor: '#7c3aed',
                                        }} />
                                    </View>
                                    <View style={{ flexDirection: 'row', marginTop: 8, gap: 10 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#34d399', marginRight: 4 }} />
                                            <Text style={{ color: '#71717a', fontSize: 10, fontFamily: 'Inter_400Regular' }}>{deployed} live</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fbbf24', marginRight: 4 }} />
                                            <Text style={{ color: '#71717a', fontSize: 10, fontFamily: 'Inter_400Regular' }}>{building} building</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </GlowCard>

                        {/* ── Right stack ── */}
                        <View style={{ flex: 1, gap: GAP }}>
                            {/* Deployed / Live */}
                            <GlowCard
                                style={{ flex: 1 }}
                                glowColor="#34d399" glowOpacity={0.22}
                                innerBg="rgba(52,211,153,0.06)"
                            >
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                        <Pulse color="#34d399" />
                                        <Text style={{ color: '#34d399', fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8 }}>LIVE</Text>
                                    </View>
                                    <Text style={{ color: '#fff', fontSize: 38, fontFamily: 'Inter_700Bold', letterSpacing: -1.5, lineHeight: 40 }}>{deployed}</Text>
                                    <Text style={{ color: '#3f3f46', fontSize: 10.5, fontFamily: 'Inter_400Regular', marginTop: 2 }}>of {total} total</Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 'auto', paddingTop: 10 }}>
                                        {Array.from({ length: Math.min(total, 8) }).map((_, i) => (
                                            <View key={i} style={{
                                                width: 7, height: 7, borderRadius: 2,
                                                backgroundColor: i < deployed ? '#34d399' : 'rgba(255,255,255,0.08)',
                                            }} />
                                        ))}
                                    </View>
                                </View>
                            </GlowCard>

                            {/* Building */}
                            <GlowCard
                                style={{ flex: 1 }}
                                glowColor="#fbbf24" glowOpacity={0.22}
                                innerBg="rgba(251,191,36,0.06)"
                            >
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                        <Pulse color="#fbbf24" />
                                        <Text style={{ color: '#fbbf24', fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8 }}>BUILDING</Text>
                                    </View>
                                    <Text style={{ color: '#fff', fontSize: 38, fontFamily: 'Inter_700Bold', letterSpacing: -1.5, lineHeight: 40 }}>{building}</Text>
                                    <Text style={{ color: '#3f3f46', fontSize: 10.5, fontFamily: 'Inter_400Regular', marginTop: 2 }}>in progress</Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 'auto', paddingTop: 10 }}>
                                        {Array.from({ length: Math.min(total, 8) }).map((_, i) => (
                                            <View key={i} style={{
                                                width: 7, height: 7, borderRadius: 2,
                                                backgroundColor: i < building ? '#fbbf24' : 'rgba(255,255,255,0.08)',
                                            }} />
                                        ))}
                                    </View>
                                </View>
                            </GlowCard>
                        </View>
                    </View>

                    {/* ══════════ ROW 2 — Create + Explore ══════════ */}
                    <View style={{ flexDirection: 'row', gap: GAP, marginBottom: GAP }}>
                        {/* ── New App CTA ── */}
                        <GlowCard
                            style={{ flex: 1.55, height: 138 }}
                            glowColor="#7c3aed" glowOpacity={0.6}
                            innerBg="transparent" onPress={open} noPad
                        >
                            <LinearGradient
                                colors={['#3b0764', '#6d28d9', '#7c3aed']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={{ flex: 1, borderRadius: 20, padding: 16, justifyContent: 'space-between' }}
                            >
                                <View style={[s.iconBox, { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.25)' }]}>
                                    <Ionicons name="add" size={18} color="#fff" />
                                </View>
                                <View>
                                    <Text style={{ color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 }}>New App</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 }}>
                                        Build with AI →{'  '}<Text style={{ color: 'rgba(255,255,255,0.8)' }}>60%</Text>
                                    </Text>
                                </View>
                            </LinearGradient>
                        </GlowCard>

                        {/* ── Explore ── */}
                        <GlowCard
                            style={{ flex: 1, height: 138 }}
                            glowColor="#38bdf8" glowOpacity={0.18}
                            innerBg="rgba(56,189,248,0.06)"
                            onPress={() => router.push('/(tabs)/explore')}
                        >
                            <View style={{ flex: 1, justifyContent: 'space-between' }}>
                                <View style={[s.iconBox, { backgroundColor: 'rgba(56,189,248,0.12)', borderColor: 'rgba(56,189,248,0.22)' }]}>
                                    <Ionicons name="globe-outline" size={16} color="#38bdf8" />
                                </View>
                                <View>
                                    <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: -0.4 }}>Explore</Text>
                                    <Text style={s.sublabel}>Community</Text>
                                </View>
                            </View>
                        </GlowCard>
                    </View>

                    {/* ══════════ RECENT APPS ══════════ */}
                    <GlowCard
                        style={{ marginBottom: GAP }}
                        glowColor="#7c3aed" glowOpacity={0.1}
                        innerBg="rgba(255,255,255,0.025)"
                        pad={16}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <Text style={s.sectionTitle}>Recent Apps</Text>
                            <TouchableOpacity>
                                <Text style={{ color: '#7c3aed', fontSize: 12, fontFamily: 'Inter_500Medium' }}>See all</Text>
                            </TouchableOpacity>
                        </View>

                        {isLoading ? (
                            <View style={{ alignItems: 'center', paddingVertical: 24 }}><Spinner /></View>
                        ) : recent.length === 0 ? (
                            <EmptyState onPress={open} />
                        ) : (
                            recent.map((b: any, idx: number) => (
                                <BuildRow
                                    key={b.id} build={b}
                                    last={idx === recent.length - 1}
                                    onPress={() => router.push(`/(builder)/${b.id}`)}
                                />
                            ))
                        )}
                    </GlowCard>

                    {/* ══════════ ROW 3 — Profile + AI ══════════ */}
                    <View style={{ flexDirection: 'row', gap: GAP }}>
                        {/* ── Profile ── */}
                        <GlowCard
                            style={{ flex: 1, height: 158 }}
                            glowColor="#a855f7" glowOpacity={0.25}
                            innerBg="rgba(168,85,247,0.09)"
                            onPress={() => router.push('/profile')}
                        >
                            <View style={{ flex: 1, justifyContent: 'space-between' }}>
                                {user?.imageUrl ? (
                                    <View style={{
                                        width: 52, height: 52, borderRadius: 18,
                                        borderWidth: 2, borderColor: 'rgba(168,85,247,0.7)',
                                        overflow: 'hidden', backgroundColor: '#1a1a2e',
                                    }}>
                                        <Image source={{ uri: user.imageUrl }} style={{ width: '100%', height: '100%' }} />
                                    </View>
                                ) : (
                                    <View style={[s.iconBox, { width: 46, height: 46, borderRadius: 16, backgroundColor: 'rgba(168,85,247,0.15)', borderColor: 'rgba(168,85,247,0.28)' }]}>
                                        <Ionicons name="person" size={20} color="#a855f7" />
                                    </View>
                                )}
                                <View>
                                    <Text style={[s.rowTitle, { fontSize: 16 }]} numberOfLines={1}>
                                        {user?.firstName || 'Profile'}
                                    </Text>
                                    <Text style={[s.sublabel, { fontSize: 12 }]}>View profile →</Text>
                                </View>
                            </View>
                        </GlowCard>

                        {/* ── AI Badge ── */}
                        <GlowCard
                            style={{ flex: 1.65, height: 158 }}
                            glowColor="#7c3aed" glowOpacity={0.4}
                            innerBg="rgba(109,40,217,0.14)"
                            onPress={open}
                        >
                            <View style={{ flex: 1, justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Pulse color="#a78bfa" />
                                    <Text style={{ color: '#a78bfa', fontSize: 11.5, fontFamily: 'Inter_600SemiBold' }}>AI Ready</Text>
                                </View>
                                <View>
                                    <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold', lineHeight: 22 }}>
                                        Describe it.{'\n'}We'll build it.
                                    </Text>
                                    <TouchableOpacity
                                        onPress={open}
                                        style={{
                                            marginTop: 8, alignSelf: 'flex-start',
                                            backgroundColor: '#7c3aed',
                                            paddingHorizontal: 12, paddingVertical: 5,
                                            borderRadius: 20,
                                        }}
                                    >
                                        <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>Start now →</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </GlowCard>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    )
}

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const s = StyleSheet.create({
    greet: {
        color: '#a1a1aa',
        fontSize: 13,
        fontFamily: 'Inter_400Regular',
        marginBottom: 1,
    },
    name: {
        color: '#fff',
        fontSize: 28,
        fontFamily: 'Inter_700Bold',
        letterSpacing: -0.8,
    },
    iconBox: {
        width: 36, height: 36, borderRadius: 12,
        borderWidth: 1, justifyContent: 'center', alignItems: 'center',
    },
    bigNum: {
        color: '#fff',
        fontSize: 36,
        fontFamily: 'Inter_700Bold',
        lineHeight: 40,
        letterSpacing: -1.2,
    },
    sublabel: {
        color: '#71717a',
        fontSize: 11.5,
        fontFamily: 'Inter_400Regular',
        marginTop: 2,
    },
    miniNum: {
        color: '#fff',
        fontSize: 26,
        fontFamily: 'Inter_700Bold',
        letterSpacing: -0.8,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 15,
        fontFamily: 'Inter_600SemiBold',
    },
    rowTitle: {
        color: '#e4e4e7',
        fontSize: 13,
        fontFamily: 'Inter_600SemiBold',
    },
    rowSub: {
        color: '#71717a',
        fontSize: 11,
        fontFamily: 'Inter_400Regular',
        marginTop: 1,
    },
})
