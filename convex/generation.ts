import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation } from "./_generated/server";
import { authComponent } from "./auth";

const generationArgs = {
  buildId: v.id("builds"),
  prompt: v.string(),
  buildMode: v.optional(v.union(v.literal("fast"), v.literal("balanced"))),
  modelProvider: v.optional(
    v.union(v.literal("Azure"), v.literal("OpenAI"), v.literal("Anthropic"), v.literal("Google"))
  ),
  modelChoice: v.optional(v.string()),
};

export const generate = mutation({
  args: generationArgs,
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Unauthenticated");
    }

    const build = await ctx.runQuery(internal.buildAccess.assertBuildOwnership, {
      buildId: args.buildId,
      ownerId: user._id,
    });

    if (!build) {
      throw new ConvexError("Build not found");
    }

    const now = Date.now();
    const userSettings = await ctx.runQuery(internal.aiSettings.getForOwner, {
      ownerId: user._id,
    });

    if (userSettings) {
      const shouldReset = now >= userSettings.monthlyResetAt;
      const used = shouldReset ? 0 : userSettings.monthlyTokenUsed;
      if (userSettings.monthlyTokenLimit > 0 && used >= userSettings.monthlyTokenLimit) {
        throw new ConvexError("Monthly AI token quota exceeded. Increase your limit or wait for reset.");
      }
    }

    await ctx.runMutation(internal.generationState.setBuildState, {
      buildId: args.buildId,
      patch: {
        status: "generating",
        stage: "planning",
        stageOutput: "",
        sourcePrompt: args.prompt,
        buildMode: args.buildMode ?? "fast",
        ...(args.modelProvider || userSettings?.preferredProvider ? { provider: args.modelProvider ?? userSettings?.preferredProvider } : {}),
        ...(args.modelChoice ? { model: args.modelChoice } : {}),
        usagePromptTokens: 0,
        usageCompletionTokens: 0,
        usageTotalTokens: 0,
        debugTrace: [],
        updatedAt: now,
      },
    });

    await ctx.scheduler.runAfter(0, internal.generationRunner.runGenerate, {
      ...args,
      ownerId: user._id,
    });

    return { ok: true };
  },
});
