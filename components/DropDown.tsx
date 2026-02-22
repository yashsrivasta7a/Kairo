import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  const [open, setOpen] = useState(false);

  const handleChange = (nextValue: string) => {
    onValueChange(nextValue);
    onChange?.(nextValue);
    setOpen(false);
  };

  const selectedLabel = items.find((item) => item.value === value)?.label || 'Select option';

  return (
    <View className="w-[50%] mt-1 relative">
      {label ? (
        <Text className="mb-1 text-xs uppercase tracking-wider text-purple-300/70">{label}</Text>
      ) : null}

      <TouchableOpacity
        onPress={() => setOpen((prev) => !prev)}
        activeOpacity={0.8}
        className="h-11 rounded-xl bg-[#1a0c2f] px-4 flex-row items-center justify-between"
      >
        <Text className="text-[#E9D5FF] text-sm flex-1" numberOfLines={1}>
          {selectedLabel}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#A78BFA" />
      </TouchableOpacity>

      {open ? (
        <View className="absolute top-full left-0 right-0 mt-1 z-50" style={{ elevation: 10 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            className="rounded-xl bg-[#120720] p-2"
            style={{ maxHeight: 256 }}
          >
            {items.map((item) => {
              const selected = item.value === value;
              return (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => handleChange(item.value)}
                  className={`px-3 py-3 rounded-lg mb-1 flex-row items-center justify-between ${
                    selected ? 'bg-purple-500/20' : 'bg-transparent'
                  }`}
                  activeOpacity={0.8}
                >
                  <Text className={`text-sm ${selected ? 'text-purple-300' : 'text-[#E9D5FF]'}`}>
                    {item.label}
                  </Text>
                  {selected ? <Ionicons name="checkmark" size={16} color="#A78BFA" /> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
};

export default DropDown;