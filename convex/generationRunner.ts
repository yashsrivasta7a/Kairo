"use node";

import { ConvexError, v } from "convex/values";
import { runPipeline } from "../lib/ai/codeGenerator";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

export const runGenerate = internalAction({
  args: {
    buildId: v.id("builds"),
    ownerId: v.string(),
    prompt: v.string(),
    buildMode: v.optional(v.union(v.literal("fast"), v.literal("balanced"))),
    modelProvider: v.optional(
      v.union(v.literal("Azure"), v.literal("OpenAI"), v.literal("Anthropic"), v.literal("Google"))
    ),
    modelChoice: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const build = await ctx.runQuery(internal.buildAccess.assertBuildOwnership, {
      buildId: args.buildId,
      ownerId: args.ownerId,
    });

    if (!build) {
      throw new ConvexError("Build not found");
    }

    const userSettings = await ctx.runQuery(internal.aiSettings.getForOwner, {
      ownerId: args.ownerId,
    });

    try {
      const result = await runPipeline({
        prompt: args.prompt,
        buildMode: args.buildMode ?? "fast",
        modelProvider: args.modelProvider ?? userSettings?.preferredProvider,
        modelChoice: args.modelChoice,
        providerOverrides: {
          azureEndpoint: userSettings?.apiKeys?.azureEndpoint,
          azureApiKey: userSettings?.apiKeys?.azureApiKey,
          azureDeploymentName: userSettings?.apiKeys?.azureDeploymentName,
          openAiApiKey: userSettings?.apiKeys?.openAiApiKey,
          anthropicApiKey: userSettings?.apiKeys?.anthropicApiKey,
          googleApiKey: userSettings?.apiKeys?.googleApiKey,
        },
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
          onStageChunk: async (update) => {
            await ctx.runMutation(internal.generationState.setBuildState, {
              buildId: args.buildId,
              patch: {
                stageOutput: update.output.slice(-12000),
                updatedAt: update.updatedAt,
              },
            });
          },
          onUsage: async (update) => {
            await ctx.runMutation(internal.generationState.setBuildState, {
              buildId: args.buildId,
              patch: {
                provider: update.provider,
                model: update.model,
                usagePromptTokens: update.promptTokens,
                usageCompletionTokens: update.completionTokens,
                usageTotalTokens: update.totalTokens,
                updatedAt: update.updatedAt,
              },
            });
          },
          onDebug: async (update) => {
            const current = await ctx.runQuery(internal.buildAccess.assertBuildOwnership, {
              buildId: args.buildId,
              ownerId: args.ownerId,
            });

            const prev = Array.isArray((current as any).debugTrace) ? (current as any).debugTrace : [];
            const next = [
              ...prev.slice(-19),
              {
                stage: update.stage,
                provider: update.provider,
                model: update.model,
                promptPreview: update.promptPreview,
                responsePreview: update.responsePreview,
                promptTokens: update.promptTokens,
                completionTokens: update.completionTokens,
                totalTokens: update.totalTokens,
                updatedAt: update.updatedAt,
              },
            ];

            await ctx.runMutation(internal.generationState.setBuildState, {
              buildId: args.buildId,
              patch: {
                debugTrace: next,
                updatedAt: update.updatedAt,
              },
            });
          },
          onComplete: async (update) => {
            const blob = new Blob([update.code], {
              type: "text/plain; charset=utf-8",
            });
            const storageId = await ctx.storage.store(blob);

            await ctx.runMutation(internal.generationState.setBuildState, {
              buildId: args.buildId,
              patch: {
                code: update.code,
                storageId,
                status: update.status,
                stage: update.stage,
                stageOutput: "",
                error: undefined,
                updatedAt: update.updatedAt,
              },
            });

            if (build.storageId && build.storageId !== storageId) {
              await ctx.storage.delete(build.storageId);
            }
          },
          onFailure: async (update) => {
            await ctx.runMutation(internal.generationState.setBuildState, {
              buildId: args.buildId,
              patch: {
                status: update.status,
                stage: update.stage,
                stageOutput: "",
                error: update.error,
                updatedAt: update.updatedAt,
              },
            });
          },
        },
      });

      await ctx.runMutation(internal.generationState.setBuildState, {
        buildId: args.buildId,
        patch: {
          provider: result.provider,
          model: result.model,
          usagePromptTokens: result.usage.promptTokens,
          usageCompletionTokens: result.usage.completionTokens,
          usageTotalTokens: result.usage.totalTokens,
          updatedAt: Date.now(),
        },
      });

      await ctx.runMutation(internal.aiSettings.consumeUsageForOwner, {
        ownerId: args.ownerId,
        tokens: result.usage.totalTokens,
        now: Date.now(),
      });
    } catch (error) {
      console.error("Background generation failed", error);

      await ctx.runMutation(internal.generationState.setBuildState, {
        buildId: args.buildId,
        patch: {
          status: "failed",
          stage: "failed",
          stageOutput: "",
          error: error instanceof Error ? error.message : "Generation failed unexpectedly.",
          updatedAt: Date.now(),
        },
      });

      return { ok: false };
    }

    return { ok: true };
  },
});
