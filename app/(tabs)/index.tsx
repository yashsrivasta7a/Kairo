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
import UserProfile from 'components/userProfile';
import { useBuilds } from '../../lib/instant/useBuilds';
import { useCreateModalStore } from '../../lib/store';

const GAP = 8;
const SIDE = 20;

import GlowCard from 'components/ui/GlowCard';
import Pulse from 'components/ui/Pulse';
import CountUp from 'components/ui/CountUp';
import Chip from 'components/ui/Chip';
import BuildRow from 'components/ui/BuildRow';
import TipBanner from 'components/ui/TipBanner';
import Orb from 'components/ui/Orb';
import Spinner from 'components/ui/Spinner';
import EmptyState from 'components/ui/EmptyState';

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

  const headerA = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerA, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  // Single wave animation for building blocks
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
  const deployed = builds.filter((b: any) => b.status === 'done').length;
  const building = builds.filter((b: any) => b.status === 'building').length;

  if (!isLoaded)
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Spinner />
      </View>
    );

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={['#ffffff', '#f8f6ff', '#efe6ff', '#e9d5ff', '#c4b5fd', '#7c3aed']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <BlurView
          intensity={70}
          tint="light"
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
              <Text className="font-dmsans text-sm text-gray-500">{getGreeting()}</Text>
              <Text className="text-3xl text-purple-800 font-dmsans-bold font-semibold">
                {user?.firstName || 'Builder'}
              </Text>
            </View>
              <UserProfile className="p-3 rounded-full ml-2" size={34} />
          </Animated.View>

<View className='px-3'>

          <TipBanner />
</View>

          
          <View className="relative mb-2" style={{ borderRadius: 28, overflow: 'hidden' }}>
            
            <LinearGradient
              colors={['#fdfcff', '#fdfcff', '#fdfcff', '#fdfcff']}
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
                shadowOpacity: 0.12,
                shadowRadius: 20,
                elevation: 6,
                zIndex: -1,
              }}
            />
            <BlurView
              intensity={60}
              tint="light"
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
                glowOpacity={0.45}
                innerBg="rgba(124,58,237,0.12)">
                <View className="flex-1 justify-between">
                  
                  <View className="flex-row items-center justify-between">
                    <View className="h-9 w-9 items-center justify-center rounded-lg border border-purple-200 bg-purple-100">
                      <Ionicons name="apps-sharp" size={16} color="#a78bfa" />
                    </View>
                    <Text className="font-dmsans text-xs text-purple-600">ALL TIME</Text>
                  </View>
                  <Text
                    style={{
                      position: 'absolute',
                      right: -24,
                      bottom: -32,
                      fontFamily: 'DMSans_700Bold',
                      fontSize: 140,
                      lineHeight: 120,
                      color: '#7c3aed',
                      opacity: 0.08,
                      letterSpacing: -6,
                    }}
                    numberOfLines={1}>
                    {total}
                  </Text>

                  
                  <View className="items-start">
                    <CountUp
                      to={total}
                      style={{ fontSize: 58, lineHeight: 60, letterSpacing: -2, fontFamily: 'DMSans_700Bold', color: '#3b0764' }}
                    />
                    <Text className="font-dmsans text-sm text-purple-900">Total Apps</Text>
                  </View>

                  
                  <View>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 5,
                      }}>
                      <Text className="font-dmsans text-[10px] text-purple-700">Deployed</Text>
                      <Text className="font-dmsans text-[10px] text-purple-600">
                        {total > 0 ? Math.round((deployed / total) * 100) : 0}%
                      </Text>
                    </View>
                    <View
                      className="h-1 rounded-md"
                      style={{ backgroundColor: 'rgba(124,58,237,0.08)' }}>
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
                        <Text className="font-dmsans text-xs text-purple-800">{deployed} live</Text>
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
                        <Text className="font-dmsans text-xs text-purple-800">
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
                  glowOpacity={0.22}
                  innerBg="rgba(124,58,237,0.06)">
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        position: 'absolute',
                        right: -30,
                        bottom: -35,
                        fontFamily: 'DMSans_700Bold',
                        fontSize: 88,
                        lineHeight: 88,
                        color: '#7c3aed',
                        opacity: 0.09,
                        letterSpacing: -4,
                      }}
                      numberOfLines={1}>
                      {deployed}
                    </Text>
                    <View className="mb-1 flex-row items-center">
                      <Pulse color="#7c3aed" />
                      <Text className="font-dmsans text-xs font-semibold text-purple-700">
                        LIVE
                      </Text>
                    </View>
                    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 36, color: '#3b0764', lineHeight: 42 }}>
                      {deployed}
                    </Text>
                    <Text className="font-dmsans mt-1 text-xs text-purple-700">of {total} total</Text>
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
                          className={`h-1.5 w-1.5 rounded-sm ${i < deployed ? 'bg-purple-500' : 'bg-black/6'}`}
                        />
                      ))}
                    </View>
                  </View>
                </GlowCard>

                
                <GlowCard
                  style={{ flex: 1 }}
                  glowColor="#a78bfa"
                  glowOpacity={0.18}
                  innerBg="rgba(167,139,250,0.06)">
                  <View style={{ flex: 1 }}>
                    <View className="mb-1 flex-row items-center">
                      <Pulse color="#a78bfa" />
                      <Text className="font-dmsans text-xs font-semibold text-purple-600">
                        BUILDING
                      </Text>
                    </View>
                    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 36, color: '#3b0764', lineHeight: 42 }}>
                      {building}
                    </Text>
                    <Text className="font-dmsans mt-1 text-xs text-purple-600">in progress</Text>
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
                              backgroundColor: isActive ? 'rgba(124,58,237,0.18)' : 'rgba(0,0,0,0.06)',
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
                glowOpacity={0.14}
                innerBg="rgba(124,58,237,0.06)"
                onPress={() => router.push('/(tabs)/explore')}>
                <View style={{ flex: 1, justifyContent: 'space-between' }}>
                  <View className="h-9 w-9 items-center justify-center rounded-lg border border-purple-200 bg-purple-100">
                    <Ionicons name="globe-outline" size={16} color="#7c3aed" />
                  </View>
                  <View>
                    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 20, color: '#3b0764' }}>Explore</Text>
                    <Text className="font-dmsans mt-1 text-xs text-purple-700">Community</Text>
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
            glowOpacity={0.1}
            innerBg="rgba(255,255,255,0.025)"
            pad={16}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}>
              <Text className="font-dmsans text-sm font-semibold text-purple-800">Recent Apps</Text>
              <TouchableOpacity>
                <Text className="font-dmsans text-xs text-purple-500">See all</Text>
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

            {/* Profile card */}
            <GlowCard
              style={{ flex: 1, height: 152 }}
              glowColor="#a78bfa"
              glowOpacity={0.22}
              innerBg="rgba(167,139,250,0.07)"
              onPress={() => router.push('/profile')}>
              <View style={{ flex: 1, justifyContent: 'space-between' }}>
                {/* Ghost icon background */}
                <Ionicons
                  name="person-circle"
                  size={100}
                  color="#a78bfa"
                  style={{ position: 'absolute', right: -18, bottom: -14, opacity: 0.07 }}
                />
                {/* Avatar */}
                {user?.imageUrl ? (
                  <View style={{
                    width: 44, height: 44, borderRadius: 14,
                    overflow: 'hidden', borderWidth: 2,
                    borderColor: 'rgba(168,85,247,0.6)', backgroundColor: '#fff',
                  }}>
                    <Image source={{ uri: user.imageUrl }} style={{ width: 44, height: 44 }} />
                  </View>
                ) : (
                  <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ede9fe' }}>
                    <Ionicons name="person" size={22} color="#a855f7" />
                  </View>
                )}
                {/* Info */}
                <View>
                  <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: '#3b0764' }} numberOfLines={1}>
                    {user?.firstName || 'Profile'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 6 }}>
                    <View style={{ backgroundColor: 'rgba(124,58,237,0.1)', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 }}>
                      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 10, color: '#7c3aed' }}>{total} apps</Text>
                    </View>
                  </View>
                  <Text className="font-dmsans mt-1.5 text-[11px] text-purple-500">View profile →</Text>
                </View>
              </View>
            </GlowCard>

            {/* AI Build card */}
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
                {/* Decorative bg element */}
                <Ionicons
                  name="sparkles"
                  size={110}
                  color="#fff"
                  style={{ position: 'absolute', right: -16, bottom: -20, opacity: 0.06 }}
                />
                {/* Top row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="flash" size={14} color="#fff" />
                  </View>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 }}>AI BUILDER</Text>
                </View>
                {/* Copy */}
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
