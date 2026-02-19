import { init } from "@instantdb/admin";
import schema from "./schema";

export const adminDB = init({
    appId: process.env.EXPO_PUBLIC_INSTANT_APP_ID,
    schema, adminToken: process.env.INSTANT_APP_ADMIN_TOKEN
})

