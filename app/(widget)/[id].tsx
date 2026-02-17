import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function WidgetDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <View className="flex-1 items-center justify-center bg-black">
            <Text className="text-white text-2xl font-bold">Widget</Text>
            <Text className="text-gray-400 mt-2">ID: {id}</Text>
        </View>
    );
}
