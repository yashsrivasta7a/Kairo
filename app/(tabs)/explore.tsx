import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';

import GlowCard from 'components/ui/GlowCard';
import Spinner from 'components/ui/Spinner';
import BuildRow from 'components/ui/BuildRow';
import { usePublicBuilds } from 'lib/instant/usePublicBuilds';

const SIDE = 20;

export default function ExploreScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const dk = colorScheme === 'dark';
  const { builds, isLoading } = usePublicBuilds();

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
            paddingHorizontal: SIDE,
            paddingVertical: 12,
          }}>
          <Text
            style={{
              flex: 1,
              textAlign: 'left',
              fontSize: 22,
              fontFamily: 'DMSans_700Bold',
              color: dk ? 'white' : '#3b0764',
            }}>
            Community
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: SIDE,
            paddingBottom: 80,
          }}
          showsVerticalScrollIndicator={false}>
          <GlowCard
            style={{ marginBottom: 12 }}
            glowColor="#7c3aed"
            glowOpacity={0.2}
            innerBg="rgba(255,255,255,0.04)"
            pad={16}>
            <Text
              style={{
                marginBottom: 8,
                fontSize: 14,
                fontFamily: 'DMSans_500Medium',
                color: dk ? '#c4b5fd' : '#6b21a8',
              }}>
              Public apps from the Kairo community.
            </Text>

            {isLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Spinner />
              </View>
            ) : builds.length === 0 ? (
              <View style={{ paddingVertical: 24 }}>
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 14,
                    fontFamily: 'DMSans_400Regular',
                    color: dk ? '#9ca3af' : '#6b7280',
                  }}>
                  No public apps yet.
                </Text>
                <Text
                  style={{
                    marginTop: 4,
                    textAlign: 'center',
                    fontSize: 12,
                    fontFamily: 'DMSans_400Regular',
                    color: dk ? '#6b7280' : '#9ca3af',
                  }}>
                  Make one of your apps public from the Builder to share it here.
                </Text>
              </View>
            ) : (
              builds.map((b: any, idx: number) => (
                <BuildRow
                  key={b.id}
                  build={b}
                  last={idx === builds.length - 1}
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
