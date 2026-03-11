import { ConvexError, v } from 'convex/values';
import { internalQuery, mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { authComponent } from './auth';

function slugifyAppName(appName: string) {
  return appName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'untitled-app';
}

async function requireCurrentUser(ctx: any) {
  const user = await authComponent.getAuthUser(ctx);
  if (!user) {
    throw new ConvexError('Unauthenticated');
  }
  return user;
}

function toBuildView(build: Doc<'builds'>) {
  return {
    id: build._id,
    ownerId: build.ownerId,
    appName: build.appName,
    slug: build.slug,
    code: build.code,
    status: build.status,
    stage: build.stage,
    error: build.error,
    createdAt: build.createdAt,
    updatedAt: build.updatedAt,
  };
}

export const listForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    const builds = await ctx.db
      .query('builds')
      .withIndex('by_ownerId_updatedAt', (q) => q.eq('ownerId', user._id))
      .collect();

    return builds
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map(toBuildView);
  },
});

export const getForCurrentUser = query({
  args: { buildId: v.id('builds') },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const build = await ctx.db.get(args.buildId);

    if (!build || build.ownerId !== user._id) {
      return null;
    }

    return toBuildView(build);
  },
});

export const create = mutation({
  args: { appName: v.string() },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const now = Date.now();

    const buildId = await ctx.db.insert('builds', {
      ownerId: user._id,
      appName: args.appName.trim(),
      slug: slugifyAppName(args.appName),
      code: '',
      status: 'idle',
      stage: 'idle',
      createdAt: now,
      updatedAt: now,
    });

    return { buildId, slug: slugifyAppName(args.appName) };
  },
});

export const getOwnedBuildInternal = internalQuery({
  args: {
    buildId: v.id('builds'),
    ownerId: v.string(),
  },
  handler: async (ctx, args) => {
    const build = await ctx.db.get(args.buildId);
    if (!build || build.ownerId !== args.ownerId) {
      return null;
    }
    return build;
  },
});

export const assertBuildOwnership = internalQuery({
  args: {
    buildId: v.id('builds'),
    ownerId: v.string(),
  },
  handler: async (ctx, args) => {
    const build = await ctx.db.get(args.buildId);
    if (!build || build.ownerId !== args.ownerId) {
      throw new ConvexError('Build not found');
    }
    return build;
  },
});