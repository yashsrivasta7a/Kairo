import { id } from "@instantdb/admin";
import { platformApi } from "lib/instant/platformAPI";
import { adminDB } from "lib/instant/adminDb";


/**
 * Find or create an InstantDB $users record for a given Clerk userId.
 * Returns the InstantDB UUID for that user.
 */
async function getOrCreateInstantUser(
    clerkId: string,
    extra?: { email?: string; displayName?: string; photoURL?: string }
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
            displayName: extra?.displayName || '',
            photoURL: extra?.photoURL || '',
            createdAt: Date.now(),
        }),
    ]);

    return newUserId;
}


export async function POST(req: Request) {
    try {
        const { userId, appName } = await req.json();

        if (!userId || typeof userId !== 'string') {
            return Response.json({ error: 'UserId is required' }, { status: 400 });
        }
        if (!appName || typeof appName !== 'string') {
            return Response.json({ error: 'AppName is required' }, { status: 400 });
        }

        const instantUserId = await getOrCreateInstantUser(userId);

        const buildId = id();
        const { app: instantApp } = await platformApi.createApp({
            title: appName,
            orgId: process.env.INSTANT_APP_ORG_ID!,
        });

        const slug = appName;
        await adminDB.transact([
            adminDB.tx.builds[buildId]
                .update({
                    instantId: instantApp.id,
                    code: '',
                    streaming: 'false',
                    slug,
                    status: 'idle',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                })
                .link({ owner: instantUserId }),
        ]);

        return Response.json({ buildId, slug });
    } catch (error: any) {
        console.error("Create Build API Error:", error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
