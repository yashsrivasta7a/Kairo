import React from 'react';
import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';

type DropDownProps = {
  label?: string;
  items: { label: string; value: string }[];
  value: string;
  onValueChange: (value: string) => void;
};

const DropDown: React.FC<DropDownProps> = ({
  label = 'Select Build',
  items,
  value,
  onValueChange,
}) => {
  return (
    <View className="my-2 w-full" >
      {label && <Text className="mb-1 text-sm font-semibold text-white">{label}</Text>}
      <View className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
        <Picker
          selectedValue={value}
          onValueChange={onValueChange}
          style={{ height: 44, color: '#fff' }}
        >
          {items.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>
    </View>
  );
};

export default DropDown;