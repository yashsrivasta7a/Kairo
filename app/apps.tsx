import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

import { useBuilds } from '../lib/instant/useBuilds';
import { useCreateModalStore } from '../lib/store';
import GlowCard from '../components/ui/GlowCard';
import BuildRow from '../components/ui/BuildRow';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';

const SIDE = 20;

export default function AppsScreen() {
  const router = useRouter();
  const { open } = useCreateModalStore();
  const { builds, isLoading } = useBuilds();
  const { colorScheme } = useColorScheme();
  const dk = colorScheme === 'dark';

  const allApps = [...builds].sort((a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0));

  return (
    <LinearGradient
      colors={dk ? ['#0d031f', '#000000', '#2b1157'] : ['#f5f3ff', '#ffffff', '#ede9fe']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 8 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={22} color={dk ? 'white' : '#3b0764'} />
          </TouchableOpacity>
          <Text
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 18,
              fontFamily: 'DMSans_700Bold',
              color: dk ? 'white' : '#3b0764',
            }}>
            All Apps
          </Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: SIDE,
            paddingBottom: 60,
          }}
          showsVerticalScrollIndicator={false}>
          <GlowCard
            style={{ marginBottom: 8 }}
            glowColor="#7c3aed"
            glowOpacity={0.2}
            innerBg="rgba(255,255,255,0.04)"
            pad={16}>
            {isLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Spinner />
              </View>
            ) : allApps.length === 0 ? (
              <EmptyState onPress={open} />
            ) : (
              allApps.map((b: any, idx: number) => (
                <BuildRow
                  key={b.id}
                  build={b}
                  last={idx === allApps.length - 1}
                  onPress={() => router.push(`/(builder)/${b.id}`)}
                />
              ))
            )}
          </GlowCard>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
