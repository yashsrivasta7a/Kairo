"use node";

import { ConvexError, v } from "convex/values";
import { runPipeline } from "../lib/ai/codeGenerator";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { authComponent } from "./auth";

export const generate = action({
  args: {
    buildId: v.id("builds"),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Unauthenticated");
    }

    const build = await ctx.runQuery(internal.builds.assertBuildOwnership, {
      buildId: args.buildId,
      ownerId: user._id,
    });

    if (!build) {
      throw new ConvexError("Build not found");
    }

    await ctx.runMutation(internal.generationState.setBuildState, {
      buildId: args.buildId,
      patch: {
        status: "generating",
        stage: "specs",
        error: undefined,
        updatedAt: Date.now(),
      },
    });

    try {
      await runPipeline({
        prompt: args.prompt,
        handlers: {
          onProgress: async (update) => {
            await ctx.runMutation(internal.generationState.setBuildState, {
              buildId: args.buildId,
              patch: {
                status: update.status,
                stage: update.stage,
                updatedAt: update.updatedAt,
              },
            });
          },
          onComplete: async (update) => {
            await ctx.runMutation(internal.generationState.setBuildState, {
              buildId: args.buildId,
              patch: {
                code: update.code,
                status: update.status,
                stage: update.stage,
                error: undefined,
                updatedAt: update.updatedAt,
              },
            });
          },
          onFailure: async (update) => {
            await ctx.runMutation(internal.generationState.setBuildState, {
              buildId: args.buildId,
              patch: {
                status: update.status,
                stage: update.stage,
                error: update.error,
                updatedAt: update.updatedAt,
              },
            });
          },
        },
      });
    } catch {
      return { ok: false };
    }

    return { ok: true };
  },
});
