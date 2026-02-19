import { id } from "@instantdb/react-native";
import { platformApi } from "lib/instant/platformAPI";
import { adminDB } from "lib/instant/adminDb";
import { generateAndStreamCode } from "lib/ai/codeGenerator";


export async function POST(req: Request) {
    try {
        const { prompt, userId, appName } = await req.json();

        if (!prompt || typeof prompt !== 'string') {
            return new Response(JSON.stringify({ error: 'Prompt is required and must be a string' }), { status: 400 });
        }
        if (!userId || typeof userId !== 'string') {
            return new Response(JSON.stringify({ error: 'UserId is required' }), { status: 400 });
        }
        if (!appName || typeof appName !== 'string') {
            return new Response(JSON.stringify({ error: 'AppName is required' }), { status: 400 });
        }

        const buildId = id();
        await createBuildRecord(userId, { buildId, title: appName });
        generateAndStreamCode({ buildId, prompt, userId }).catch(err => {
            console.error("Background Generation Failed:", err);
        });
        return Response.json({ buildId });

    } catch (error: any) {
        console.error("API Route Error:", error);
        return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

async function createBuildRecord(
    userId: string,
    {
        buildId,
        title,
    }: {
        buildId: string;
        title: string;
    }
) {
    const { app: instantApp } = await platformApi.createApp({
        title: title,
        orgId: process.env.INSTANT_APP_ORG_ID!,
    });

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

    const initialBuild = {
        instantId: instantApp.id,
        code: '',
        streaming: 'false',
        slug: slug,
        status: 'creating',
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    try {
        await adminDB.transact([
            adminDB.tx.builds[buildId].update(initialBuild).link({ owner: userId })
        ]);
    } catch (error: any) {
        console.error('Error creating initial build record', error);
        throw error;
    }

    return initialBuild;
}
