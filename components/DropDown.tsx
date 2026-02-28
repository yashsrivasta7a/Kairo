import React, { useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { LinearGradient } from 'expo-linear-gradient';

type DropDownProps = {
  label?: string;
  items: { label: string; value: string }[];
  value: string;
  onValueChange: (value: string) => void;
  onChange?: (value: string) => void;
};

const DropDown: React.FC<DropDownProps> = ({
  label,
  items,
  value,
  onValueChange,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { colorScheme } = useColorScheme();
  const dk = colorScheme === 'dark';

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['60%'], []);

  const openSheet = () => {
    bottomSheetModalRef.current?.present();
    setIsOpen(true);
  };

  const handleChange = (nextValue: string) => {
    onValueChange(nextValue);
    onChange?.(nextValue);
    bottomSheetModalRef.current?.dismiss();
    setIsOpen(false);
  };

  const renderBackdrop = (props: BottomSheetDefaultBackdropProps) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
  );

  const selectedLabel = items.find((item) => item.value === value)?.label || 'Select option';

  const bg = dk ? '#0a0a1a' : '#f5f3ff';
  const border = dk ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const textPrimary = dk ? '#f0e6ff' : '#1a1a2e';
  const textMuted = dk ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)';
  const accent = dk ? '#a78bfa' : '#7c3aed';

  return (
    <View style={{ width: '100%', marginTop: 4 }}>
      {label ? (
        <Text style={{ color: textMuted, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
          {label}
        </Text>
      ) : null}


      <TouchableOpacity
        onPress={openSheet}
        activeOpacity={0.75}
        style={{
          height: 44,
          borderRadius: 12,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          borderWidth: 1,
          borderColor: border,
        }}
      >
        <Text style={{ color: textPrimary, fontSize: 14, flex: 1 }} numberOfLines={1}>
          {selectedLabel}
        </Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={15}
          color={textMuted}
          style={{ marginLeft: 6 }}
        />
      </TouchableOpacity>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        onDismiss={() => setIsOpen(false)}
        backdropComponent={renderBackdrop}
        detached
        bottomInset={24}
        style={{ marginHorizontal: 6 }}
        backgroundStyle={{ backgroundColor: 'transparent' }}
        handleIndicatorStyle={{
          backgroundColor: dk ? '#a78bfa' : 'rgba(0,0,0,0.15)',
          width: 36,
        }}
      >
          <LinearGradient
            colors={dk ? ['#0d031f', '#000000', '#2b1157'] : ['#f5f3ff', '#ffffff', '#ede9fe']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
            pointerEvents="none"
          />
          <BottomSheetFlatList
            data={[...items].reverse()}
            keyExtractor={(item) => item.value}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 8 }}
            ListHeaderComponent={
              <View
                style={{
                  paddingHorizontal: 20,
                  paddingTop: 16,
                  paddingBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: border,
                }}
              >
                <Text style={{ color: textPrimary, fontSize: 15, fontWeight: '600' }}>
                  {label || 'Select'}
                </Text>
                <Text style={{ color: textMuted, fontSize: 12, marginTop: 2 }}>
                  {items.length} options
                </Text>
              </View>
            }
            renderItem={({ item, index }) => {
              const selected = item.value === value;
              return (
                <TouchableOpacity
                  onPress={() => handleChange(item.value)}
                  activeOpacity={0.6}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    borderBottomWidth: index < items.length - 1 ? 1 : 0,
                    borderBottomColor: border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: selected ? accent : textPrimary,
                      fontWeight: selected ? '600' : '400',
                    }}
                  >
                    {item.label}
                  </Text>
                  {selected && (
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: dk ? 'rgba(167,139,250,0.15)' : 'rgba(124,58,237,0.1)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent }} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
      </BottomSheetModal>
    </View>
  );
};

export default DropDown;


