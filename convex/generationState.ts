import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const setBuildState = internalMutation({
  args: {
    buildId: v.id("builds"),
    patch: v.object({
      code: v.optional(v.string()),
      storageId: v.optional(v.id("_storage")),
      status: v.optional(
        v.union(v.literal("idle"), v.literal("generating"), v.literal("completed"), v.literal("failed"))
      ),
      stage: v.optional(
        v.union(
          v.literal("idle"),
          v.literal("specs"),
          v.literal("screens"),
          v.literal("gluing"),
          v.literal("validation"),
          v.literal("completed"),
          v.literal("failed")
        )
      ),
      stageOutput: v.optional(v.string()),
      provider: v.optional(v.string()),
      model: v.optional(v.string()),
      usagePromptTokens: v.optional(v.number()),
      usageCompletionTokens: v.optional(v.number()),
      usageTotalTokens: v.optional(v.number()),
      debugTrace: v.optional(
        v.array(
          v.object({
            stage: v.string(),
            provider: v.string(),
            model: v.string(),
            promptPreview: v.string(),
            responsePreview: v.string(),
            promptTokens: v.number(),
            completionTokens: v.number(),
            totalTokens: v.number(),
            updatedAt: v.number(),
          })
        )
      ),
      error: v.optional(v.string()),
      updatedAt: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.buildId, args.patch);
  },
});
