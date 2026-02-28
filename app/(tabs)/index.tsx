import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import UserProfile from 'components/userProfile';
import { useBuilds } from '../../lib/instant/useBuilds';
import { useCreateModalStore } from '../../lib/store';
import { useTheme } from '../../constants/ThemeContext';
import GlowCard from 'components/ui/GlowCard';
import Pulse from 'components/ui/Pulse';
import CountUp from 'components/ui/CountUp';
import Chip from 'components/ui/Chip';
import BuildRow from 'components/ui/BuildRow';
import TipBanner from 'components/ui/TipBanner';
import Orb from 'components/ui/Orb';
import Spinner from 'components/ui/Spinner';
import EmptyState from 'components/ui/EmptyState';

const GAP = 8;
const SIDE = 20;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Late night 🌙';
  if (h < 12) return 'Good morning ☀️';
  if (h < 17) return 'Good afternoon 🌤';
  return 'Good evening 🌙';
}

export default function HomeScreen() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { open } = useCreateModalStore();
  const { builds, isLoading } = useBuilds();
  const [refreshing, setRefreshing] = useState(false);
  const { colorScheme } = useColorScheme();
  const { toggleTheme } = useTheme();
  const dk = colorScheme === 'dark';

  const headerA = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerA, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const BLOCK_MAX = 8;
  const waveAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: BLOCK_MAX,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.delay(400),
        Animated.timing(waveAnim, { toValue: 0, duration: 0, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const recent = [...builds]
    .sort((a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 4);
  const total = builds.length;
  const deployed = builds.filter((b: any) => b.status === 'completed').length;
  const building = builds.filter((b: any) => b.status === 'generating').length;

  if (!isLoaded)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: dk ? '#09090f' : '#f5f3ff' }}>
        <Spinner />
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: dk ? '#09090f' : '#f5f3ff' }}>
      <StatusBar barStyle={dk ? 'light-content' : 'dark-content'} />


      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={dk ? ['#09090f', '#0e0a1f', '#130d2a', '#1a1035', '#2a1554', '#3b0764'] : ['#f5f3ff', '#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#7c3aed']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <BlurView
          intensity={70}
          tint={dk ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFillObject, { opacity: 0.9 }]}
        />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: SIDE, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                setTimeout(() => setRefreshing(false), 1200);
              }}
              tintColor="#7c3aed"
            />
          }>

          <Animated.View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              paddingTop: 8,
              paddingBottom: 14,
              opacity: headerA,
              transform: [
                { translateY: headerA.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) },
              ],
            }}>
            <View>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: dk ? '#a78bfa' : '#6b7280' }}>{getGreeting()}</Text>
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 30, color: dk ? '#e9d5ff' : '#3b0764', lineHeight: 36 }}>
                {user?.firstName || 'Builder'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                onPress={toggleTheme}
                style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: dk ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.1)', borderWidth: 1, borderColor: dk ? 'rgba(124,58,237,0.5)' : 'rgba(124,58,237,0.25)' }}>
                <Ionicons name={dk ? 'sunny-outline' : 'moon-outline'} size={16} color={dk ? '#c4b5fd' : '#7c3aed'} />
              </TouchableOpacity>
              <UserProfile className="p-3 rounded-full ml-2" size={34} />
            </View>
          </Animated.View>

          <View className='px-3'>

            <TipBanner />
          </View>


          <View className="relative mb-2" style={{ borderRadius: 28, overflow: 'hidden' }}>

            <LinearGradient
              colors={dk ? ['#13102a', '#13102a', '#13102a', '#13102a'] : ['#ffffff', '#ffffff', '#ffffff', '#ffffff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                borderRadius: 28,
                shadowColor: '#7c3aed',
                shadowOpacity: dk ? 0.3 : 0.12,
                shadowRadius: 20,
                elevation: 6,
                zIndex: -1,
              }}
            />
            <BlurView
              intensity={60}
              tint={dk ? 'dark' : 'light'}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                borderRadius: 28,
                zIndex: -1,
              }}
            />

            <View className="flex-row gap-2 p-3">

              <GlowCard
                style={{ flex: 1.55, height: 260 }}
                glowColor="#7c3aed"
                glowOpacity={dk ? 0.5 : 0.35}
                innerBg={dk ? 'rgba(124,58,237,0.22)' : 'rgba(124,58,237,0.08)'}>
                <View className="flex-1 justify-between">

                  <View className="flex-row items-center justify-between">
                    <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: dk ? 'rgba(167,139,250,0.3)' : '#e9d5ff', backgroundColor: dk ? 'rgba(124,58,237,0.2)' : '#f3e8ff' }}>
                      <Ionicons name="apps-sharp" size={16} color={dk ? '#a78bfa' : '#7c3aed'} />
                    </View>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: dk ? '#a78bfa' : '#9333ea' }}>ALL TIME</Text>
                  </View>
                  <Text
                    style={{
                      position: 'absolute',
                      right: -24,
                      bottom: -32,
                      fontFamily: 'DMSans_700Bold',
                      fontSize: 140,
                      lineHeight: 120,
                      color: '#a78bfa',
                      opacity: 0.15,
                      letterSpacing: -6,
                    }}
                    numberOfLines={1}>
                    {total}
                  </Text>


                  <View className="items-start">
                    <CountUp
                      to={total}
                      style={{ fontSize: 58, lineHeight: 60, letterSpacing: -2, fontFamily: 'DMSans_700Bold', color: dk ? '#e9d5ff' : '#3b0764' }}
                    />
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: dk ? '#d8b4fe' : '#581c87' }}>Total Apps</Text>
                  </View>


                  <View>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 5,
                      }}>
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: dk ? '#c4b5fd' : '#7e22ce' }}>Deployed</Text>
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: dk ? '#a78bfa' : '#9333ea' }}>
                        {total > 0 ? Math.round((deployed / total) * 100) : 0}%
                      </Text>
                    </View>
                    <View
                      className="h-1 rounded-md"
                      style={{ backgroundColor: dk ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.1)' }}>
                      <View
                        style={{
                          height: 4,
                          borderRadius: 4,
                          width: total > 0 ? `${Math.round((deployed / total) * 100)}%` : '0%',
                          backgroundColor: '#7c3aed',
                        }}
                      />
                    </View>
                    <View style={{ flexDirection: 'row', marginTop: 8, gap: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#7c3aed',
                            marginRight: 4,
                          }}
                        />
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: dk ? '#d8b4fe' : '#6d28d9' }}>{deployed} live</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#a78bfa',
                            marginRight: 4,
                          }}
                        />
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: dk ? '#d8b4fe' : '#6d28d9' }}>
                          {building} building
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </GlowCard>


              <View style={{ flex: 1, gap: GAP }}>

                <GlowCard
                  style={{ flex: 1 }}
                  glowColor="#7c3aed"
                  glowOpacity={dk ? 0.3 : 0.18}
                  innerBg={dk ? 'rgba(124,58,237,0.18)' : 'rgba(124,58,237,0.06)'}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        position: 'absolute',
                        right: -30,
                        bottom: -35,
                        fontFamily: 'DMSans_700Bold',
                        fontSize: 88,
                        lineHeight: 88,
                        color: '#a78bfa',
                        opacity: 0.15,
                        letterSpacing: -4,
                      }}
                      numberOfLines={1}>
                      {deployed}
                    </Text>
                    <View className="mb-1 flex-row items-center">
                      <Pulse color="#7c3aed" />
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: dk ? '#c4b5fd' : '#7c3aed' }}>
                        LIVE
                      </Text>
                    </View>
                    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 36, color: dk ? '#e9d5ff' : '#3b0764', lineHeight: 42 }}>
                      {deployed}
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, marginTop: 4, color: dk ? '#c4b5fd' : '#7e22ce' }}>of {total} total</Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: 4,
                        marginTop: 'auto',
                        paddingTop: 10,
                      }}>
                      {Array.from({ length: Math.min(total, 8) }).map((_, i) => (
                        <View
                          key={i}
                          style={{ width: 6, height: 6, borderRadius: 2, backgroundColor: i < deployed ? '#a78bfa' : (dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)') }}
                        />
                      ))}
                    </View>
                  </View>
                </GlowCard>


                <GlowCard
                  style={{ flex: 1 }}
                  glowColor="#a78bfa"
                  glowOpacity={dk ? 0.25 : 0.15}
                  innerBg={dk ? 'rgba(167,139,250,0.15)' : 'rgba(167,139,250,0.07)'}>
                  <View style={{ flex: 1 }}>
                    <View className="mb-1 flex-row items-center">
                      <Pulse color="#a78bfa" />
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: dk ? '#c4b5fd' : '#7c3aed' }}>
                        BUILDING
                      </Text>
                    </View>
                    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 36, color: dk ? '#e9d5ff' : '#3b0764', lineHeight: 42 }}>
                      {building}
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, marginTop: 4, color: dk ? '#c4b5fd' : '#7c3aed' }}>in progress</Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: 4,
                        marginTop: 'auto',
                        paddingTop: 10,
                      }}>
                      {Array.from({ length: Math.min(total || 8, 8) }).map((_, i) => {
                        const isActive = i < building;
                        const fillW = waveAnim.interpolate({
                          inputRange: [i, i + 1],
                          outputRange: [0, 7],
                          extrapolate: 'clamp',
                        });
                        return (
                          <View
                            key={i}
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: 2,
                              backgroundColor: isActive ? (dk ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.15)') : (dk ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'),
                              overflow: 'hidden',
                            }}>
                            <Animated.View
                              style={{
                                position: 'absolute',
                                width: fillW,
                                height: 7,
                                top: 0,
                                left: 0,
                                backgroundColor: '#7c3aed',
                                borderRadius: 2,
                              }}
                            />
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </GlowCard>
              </View>
            </View>


            <View className="flex-row gap-2 px-3 pb-3">

              <GlowCard
                style={{ flex: 1.55, height: 138 }}
                glowColor="#7c3aed"
                glowOpacity={0.6}
                innerBg="transparent"
                onPress={open}
                noPad>
                <LinearGradient
                  colors={['#3b0764', '#6d28d9', '#7c3aed']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    flex: 1,
                    borderRadius: 20,
                    padding: 16,
                    justifyContent: 'space-between',
                  }}>
                  <View className="h-9 w-9 items-center justify-center rounded-lg border border-white/25 bg-white/20">
                    <Ionicons name="add" size={18} color="#fff" />
                  </View>
                  <View>
                    <Text
                      className="font-dmsans text-[22px] text-white"
                      style={{ letterSpacing: -0.5 }}>
                      New App
                    </Text>
                    <Text className="font-dmsans mt-0.5 text-[12px] text-white/90">
                      Build with AI →{'  '}
                      <Text className="text-white/95">60%</Text>
                    </Text>
                  </View>
                  <Ionicons
                    name="apps-outline"
                    size={120}
                    color="#fff"
                    style={{
                      position: 'absolute',
                      right: -18,
                      bottom: -24,
                      opacity: 0.06,
                      transform: [{ rotate: '-15deg' }],
                      elevation: 0,
                    }}
                  />
                </LinearGradient>
              </GlowCard>


              <GlowCard
                style={{ flex: 1, height: 138 }}
                glowColor="#7c3aed"
                glowOpacity={dk ? 0.28 : 0.18}
                innerBg={dk ? 'rgba(124,58,237,0.18)' : 'rgba(124,58,237,0.06)'}
                onPress={() => router.push('/(tabs)/explore')}>
                <View style={{ flex: 1, justifyContent: 'space-between' }}>
                  <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: dk ? 'rgba(167,139,250,0.3)' : '#e9d5ff', backgroundColor: dk ? 'rgba(124,58,237,0.2)' : '#f3e8ff' }}>
                    <Ionicons name="globe-outline" size={16} color={dk ? '#a78bfa' : '#7c3aed'} />
                  </View>
                  <View>
                    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 20, color: dk ? '#e9d5ff' : '#3b0764' }}>Explore</Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, marginTop: 4, color: dk ? '#c4b5fd' : '#7e22ce' }}>Community</Text>
                  </View>
                  <Ionicons
                    name="globe-outline"
                    size={96}
                    color="#7c3aed"
                    style={{
                      position: 'absolute',
                      right: -42,
                      bottom: -42,
                      opacity: 0.05,
                      transform: [{ rotate: '-10deg' }],
                    }}
                  />
                </View>
              </GlowCard>
            </View>
          </View>


          <GlowCard
            style={{ marginBottom: GAP }}
            glowColor="#7c3aed"
            glowOpacity={0.2}
            innerBg="rgba(255,255,255,0.04)"
            pad={16}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: dk ? '#d8b4fe' : '#3b0764' }}>Recent Apps</Text>
              <TouchableOpacity>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: dk ? '#a78bfa' : '#7c3aed' }}>See all</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Spinner />
              </View>
            ) : recent.length === 0 ? (
              <EmptyState onPress={open} />
            ) : (
              recent.map((b: any, idx: number) => (
                <BuildRow
                  key={b.id}
                  build={b}
                  last={idx === recent.length - 1}
                  onPress={() => router.push(`/(builder)/${b.id}`)}
                />
              ))
            )}
          </GlowCard>


          <View style={{ flexDirection: 'row', gap: GAP, marginHorizontal: 10 }}>

            <GlowCard
              style={{ flex: 1, height: 152 }}
              glowColor="#a78bfa"
              glowOpacity={dk ? 0.3 : 0.18}
              innerBg={dk ? 'rgba(167,139,250,0.12)' : 'rgba(167,139,250,0.06)'}
              onPress={() => router.push('/profile')}>
              <View style={{ flex: 1, justifyContent: 'space-between' }}>

                <Ionicons
                  name="person-circle"
                  size={100}
                  color="#a78bfa"
                  style={{ position: 'absolute', right: -18, bottom: -14, opacity: 0.07 }}
                />

                {user?.imageUrl ? (
                  <View style={{
                    width: 44, height: 44, borderRadius: 14,
                    overflow: 'hidden', borderWidth: 2,
                    borderColor: 'rgba(168,85,247,0.6)', backgroundColor: '#1a0f35',
                  }}>
                    <Image source={{ uri: user.imageUrl }} style={{ width: 44, height: 44 }} />
                  </View>
                ) : (
                  <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2e1065' }}>
                    <Ionicons name="person" size={22} color="#a855f7" />
                  </View>
                )}

                <View>
                  <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: dk ? '#e9d5ff' : '#3b0764' }} numberOfLines={1}>
                    {user?.firstName || 'Profile'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 6 }}>
                    <View style={{ backgroundColor: dk ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.1)', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 }}>
                      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 10, color: dk ? '#a78bfa' : '#7c3aed' }}>{total} apps</Text>
                    </View>
                  </View>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, marginTop: 6, color: dk ? '#a78bfa' : '#7c3aed' }}>View profile →</Text>
                </View>
              </View>
            </GlowCard>

            <GlowCard
              style={{ flex: 1.65, height: 152 }}
              glowColor="#7c3aed"
              glowOpacity={0.65}
              innerBg="transparent"
              onPress={open}
              noPad>
              <LinearGradient
                colors={['#3b0764', '#5b21b6', '#7c3aed']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, borderRadius: 20, padding: 16, justifyContent: 'space-between' }}>

                <Ionicons
                  name="sparkles"
                  size={110}
                  color="#fff"
                  style={{ position: 'absolute', right: -16, bottom: -20, opacity: 0.06 }}
                />

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="flash" size={14} color="#fff" />
                  </View>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 }}>AI BUILDER</Text>
                </View>

                <View>
                  <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 18, color: '#fff', lineHeight: 24, letterSpacing: -0.4 }}>
                    Describe it.{'\n'}Ship it.
                  </Text>
                  <TouchableOpacity
                    onPress={open}
                    style={{
                      marginTop: 10, alignSelf: 'flex-start',
                      backgroundColor: 'rgba(255,255,255,0.18)',
                      borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5,
                      borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
                    }}>
                    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 11, color: '#fff' }}>
                      Build now →
                    </Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </GlowCard>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
