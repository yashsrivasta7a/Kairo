import { id } from "@instantdb/admin";
import { adminDB } from "lib/instant/adminDb";
import { runPipeline } from "lib/ai/codeGenerator";


async function getOrCreateInstantUser(
    clerkId: string,
    extra?: { email?: string; }
): Promise<string> {
    const { $users } = await adminDB.query({ $users: { $: { where: { clerkId } } } });

    if ($users && $users.length > 0) {
        return $users[0].id;
    }


    const newUserId = id();
    await adminDB.transact([
        adminDB.tx.$users[newUserId].update({
            clerkId,
            email: extra?.email || '',
            createdAt: Date.now(),
        }),
    ]);

    console.log(newUserId);
    return newUserId;
}


export async function POST(req: Request) {
    try {
        const { prompt, userId, buildId } = await req.json();

        if (!prompt || typeof prompt !== 'string') {
            return new Response(JSON.stringify({ error: 'Prompt is required and must be a string' }), { status: 400 });
        }
        if (!userId || typeof userId !== 'string') {
            return new Response(JSON.stringify({ error: 'UserId is required' }), { status: 400 });
        }
        if (!buildId || typeof buildId !== 'string') {
            return new Response(JSON.stringify({ error: 'BuildId is required' }), { status: 400 });
        }

        const instantUserId = await getOrCreateInstantUser(userId);

        await adminDB.transact([
            adminDB.tx.builds[buildId].update({
                status: 'generating',
                updatedAt: Date.now(),
            }),
        ]);

        runPipeline({ buildId, prompt, userId: instantUserId }).catch(err => {
            console.error("Background Generation Failed:", err);
        });
        return Response.json({ buildId });

    } catch (error: any) {
        console.error("API Route Error:", error);
        return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
