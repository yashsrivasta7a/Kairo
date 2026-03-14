import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery, query, mutation } from "./_generated/server";
import { authComponent } from "./auth";

const providerValidator = v.union(v.literal("Azure"), v.literal("OpenAI"), v.literal("Anthropic"), v.literal("Google"));

function nextMonthReset(now: number) {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
}

async function requireCurrentUser(ctx: any) {
  const user = await authComponent.getAuthUser(ctx);
  if (!user) {
    throw new ConvexError("Unauthenticated");
  }
  return user;
}

export const getForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    const now = Date.now();
    const settings = await ctx.db
      .query("userAiSettings")
      .withIndex("by_ownerId", (q: any) => q.eq("ownerId", user._id))
      .first();

    if (!settings) {
      return {
        preferredProvider: "Azure" as const,
        monthlyTokenLimit: 500000,
        monthlyTokenUsed: 0,
        remainingTokens: 500000,
        hasAzureCredentials: false,
        hasOpenAiApiKey: false,
        hasAnthropicApiKey: false,
        hasGoogleApiKey: false,
      };
    }

    const shouldReset = now >= settings.monthlyResetAt;
    const monthlyTokenUsed = shouldReset ? 0 : settings.monthlyTokenUsed;
    const remaining = Math.max(0, settings.monthlyTokenLimit - monthlyTokenUsed);

    return {
      preferredProvider: settings.preferredProvider ?? "Azure",
      monthlyTokenLimit: settings.monthlyTokenLimit,
      monthlyTokenUsed,
      remainingTokens: remaining,
      hasAzureCredentials: Boolean(settings.apiKeys?.azureApiKey && settings.apiKeys?.azureEndpoint),
      hasOpenAiApiKey: Boolean(settings.apiKeys?.openAiApiKey),
      hasAnthropicApiKey: Boolean(settings.apiKeys?.anthropicApiKey),
      hasGoogleApiKey: Boolean(settings.apiKeys?.googleApiKey),
    };
  },
});

export const saveForCurrentUser = mutation({
  args: {
    preferredProvider: v.optional(providerValidator),
    monthlyTokenLimit: v.optional(v.number()),
    apiKeys: v.optional(
      v.object({
        azureEndpoint: v.optional(v.string()),
        azureApiKey: v.optional(v.string()),
        azureDeploymentName: v.optional(v.string()),
        openAiApiKey: v.optional(v.string()),
        anthropicApiKey: v.optional(v.string()),
        googleApiKey: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const now = Date.now();
    const existing = await ctx.db
      .query("userAiSettings")
      .withIndex("by_ownerId", (q: any) => q.eq("ownerId", user._id))
      .first();

    if (!existing) {
      await ctx.db.insert("userAiSettings", {
        ownerId: user._id,
        preferredProvider: args.preferredProvider,
        monthlyTokenLimit: Math.max(0, args.monthlyTokenLimit ?? 500000),
        monthlyTokenUsed: 0,
        monthlyResetAt: nextMonthReset(now),
        apiKeys: args.apiKeys,
        createdAt: now,
        updatedAt: now,
      });
      return { ok: true };
    }

    await ctx.db.patch(existing._id, {
      preferredProvider: args.preferredProvider ?? existing.preferredProvider,
      monthlyTokenLimit: Math.max(0, args.monthlyTokenLimit ?? existing.monthlyTokenLimit),
      apiKeys: args.apiKeys ?? existing.apiKeys,
      updatedAt: now,
    });

    return { ok: true };
  },
});

export const consumeUsageForOwner = internalMutation({
  args: {
    ownerId: v.string(),
    tokens: v.number(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("userAiSettings")
      .withIndex("by_ownerId", (q: any) => q.eq("ownerId", args.ownerId))
      .first();

    if (!settings) {
      return;
    }

    const shouldReset = args.now >= settings.monthlyResetAt;
    const base = shouldReset ? 0 : settings.monthlyTokenUsed;

    await ctx.db.patch(settings._id, {
      monthlyTokenUsed: Math.max(0, base + Math.max(0, args.tokens)),
      monthlyResetAt: shouldReset ? nextMonthReset(args.now) : settings.monthlyResetAt,
      updatedAt: args.now,
    });
  },
});

export const getForOwner = internalQuery({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("userAiSettings")
      .withIndex("by_ownerId", (q: any) => q.eq("ownerId", args.ownerId))
      .first();
  },
});
