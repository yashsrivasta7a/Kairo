import { ConvexError, v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

function slugifyAppName(appName: string) {
  return (
    appName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "untitled-app"
  );
}

async function requireCurrentUser(ctx: any) {
  const user = await authComponent.getAuthUser(ctx);
  if (!user) {
    throw new ConvexError("Unauthenticated");
  }
  return user;
}

function toBuildView(build: Doc<"builds">) {
  return {
    id: build._id,
    ownerId: build.ownerId,
    appName: build.appName,
    slug: build.slug,
    code: (build as any).code ?? null,
    sourcePrompt: (build as any).sourcePrompt ?? null,
    buildMode: (build as any).buildMode ?? "fast",
    storageId: build.storageId ?? null,
    hasCode: Boolean(build.storageId || (build as any).code),
    status: build.status,
    stage: build.stage,
    stageOutput: (build as any).stageOutput,
    provider: (build as any).provider,
    model: (build as any).model,
    usagePromptTokens: (build as any).usagePromptTokens,
    usageCompletionTokens: (build as any).usageCompletionTokens,
    usageTotalTokens: (build as any).usageTotalTokens,
    debugTrace: (build as any).debugTrace,
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
      .query("builds")
      .withIndex("by_ownerId_updatedAt", (q) => q.eq("ownerId", user._id))
      .collect();

    return builds.sort((left, right) => right.updatedAt - left.updatedAt).map(toBuildView);
  },
});

export const getForCurrentUser = query({
  args: { buildId: v.id("builds") },
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

    const buildId = await ctx.db.insert("builds", {
      ownerId: user._id,
      appName: args.appName.trim(),
      slug: slugifyAppName(args.appName),
      status: "idle",
      stage: "idle",
      stageOutput: "",
      usagePromptTokens: 0,
      usageCompletionTokens: 0,
      usageTotalTokens: 0,
      debugTrace: [],
      createdAt: now,
      updatedAt: now,
    });

    return { buildId, slug: slugifyAppName(args.appName) };
  },
});
