import { adminDB } from 'lib/instant/adminDb';
import { runtimeValidateCode } from 'lib/ai/runtimeValidator';

export async function POST(req: Request) {
  try {
    const { buildId } = await req.json();

    if (!buildId || typeof buildId !== 'string') {
      return Response.json({ ok: false, error: 'buildId is required' }, { status: 400 });
    }

    const { builds } = await adminDB.query({
      builds: { $: { where: { id: buildId } } },
    } as any);

    const build = builds?.[0];

    if (!build) {
      return Response.json(
        { ok: false, error: 'Build not found for provided buildId.' },
        { status: 404 },
      );
    }

    if (!build.code || typeof build.code !== 'string' || !build.code.trim()) {
      return Response.json(
        { ok: false, error: 'This build has no generated code to validate.' },
        { status: 400 },
      );
    }

    const result = runtimeValidateCode(build.code);

    return Response.json(result);
  } catch (error: any) {
    console.error('Runtime check API error:', error);
    return Response.json(
      { ok: false, error: 'Internal error while performing runtime validation.' },
      { status: 500 },
    );
  }
}

