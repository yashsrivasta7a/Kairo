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
    modelProvider: v.optional(
      v.union(v.literal("Azure"), v.literal("OpenAI"), v.literal("Anthropic"), v.literal("Google"))
    ),
    modelChoice: v.optional(v.string()),
  },
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
        stage: "specs",
        stageOutput: "",
        provider: args.modelProvider ?? userSettings?.preferredProvider,
        model: args.modelChoice,
        usagePromptTokens: 0,
        usageCompletionTokens: 0,
        usageTotalTokens: 0,
        debugTrace: [],
        error: undefined,
        updatedAt: Date.now(),
      },
    });

    try {
      const result = await runPipeline({
        prompt: args.prompt,
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
              ownerId: user._id,
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
                code: undefined,
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
        ownerId: user._id,
        tokens: result.usage.totalTokens,
        now: Date.now(),
      });
    } catch {
      return { ok: false };
    }

    return { ok: true };
  },
});
