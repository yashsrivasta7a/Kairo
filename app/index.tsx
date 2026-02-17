import { Text, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

const index = () => {
    return (
        <SafeAreaView className="flex-1 bg-dark">
            <Text className="text-2xl font-bold text-light-100">Welcome</Text>
            <Text className="text-base text-light-300">Subtitle text</Text>
            <View className="bg-dark-100 rounded-2xl p-4 border border-dark-300">
                <Text className="text-light-100">Highlighted text</Text>
            </View>
        </SafeAreaView>
    )
}

export default index