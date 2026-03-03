import { adminDB } from 'lib/instant/adminDb';

export async function POST(req: Request) {
  try {
    const { buildId, userId, public: isPublic } = await req.json();

    if (!buildId || typeof buildId !== 'string') {
      return Response.json({ error: 'buildId is required' }, { status: 400 });
    }

    if (!userId || typeof userId !== 'string') {
      return Response.json({ error: 'userId is required' }, { status: 400 });
    }

    if (typeof isPublic !== 'boolean') {
      return Response.json({ error: 'public must be a boolean' }, { status: 400 });
    }

    // Ensure the caller owns this build via their Clerk user id
    const { builds } = await adminDB.query({
      builds: { $: { where: { id: buildId, 'owner.clerkId': userId } } },
    });

    if (!builds || builds.length === 0) {
      return Response.json({ error: 'Not authorized to update this build' }, { status: 403 });
    }

    await adminDB.transact([
      adminDB.tx.builds[buildId].update({
        public: isPublic,
      }),
    ]);

    return Response.json({ ok: true });
  } catch (error: any) {
    console.error('Toggle public API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

