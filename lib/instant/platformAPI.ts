import { PlatformApi } from "@instantdb/platform";

export const platformApi = new PlatformApi({
    auth: { token: process.env.INSTANT_APP_ACCESS_TOKEN },
    apiURI: process.env.EXPO_PUBLIC_INSTANT_API_KEY,
})