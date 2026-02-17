import { Stack } from 'expo-router';

export default function WidgetLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        />
    );
}
