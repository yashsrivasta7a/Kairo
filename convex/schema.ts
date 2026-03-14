import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const buildStatus = v.union(v.literal("idle"), v.literal("generating"), v.literal("completed"), v.literal("failed"));

const buildStage = v.union(
  v.literal("idle"),
  v.literal("specs"),
  v.literal("screens"),
  v.literal("gluing"),
  v.literal("validation"),
  v.literal("completed"),
  v.literal("failed")
);

export default defineSchema({
  builds: defineTable({
    ownerId: v.string(),
    appName: v.string(),
    slug: v.string(),
    storageId: v.optional(v.id("_storage")),
    status: buildStatus,
    stage: buildStage,
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_ownerId_updatedAt", ["ownerId", "updatedAt"]),

  favorites: defineTable({
    ownerId: v.string(),
    buildId: v.id("builds"),
    createdAt: v.number(),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_ownerId_buildId", ["ownerId", "buildId"]),

  generatedAppRecords: defineTable({
    buildId: v.id("builds"),
    model: v.string(),
    entityId: v.string(),
    data: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_buildId", ["buildId"])
    .index("by_buildId_model", ["buildId", "model"])
    .index("by_buildId_model_entityId", ["buildId", "model", "entityId"]),

  userAiSettings: defineTable({
    ownerId: v.string(),
    preferredProvider: v.optional(
      v.union(v.literal("Azure"), v.literal("OpenAI"), v.literal("Anthropic"), v.literal("Google"))
    ),
    monthlyTokenLimit: v.number(),
    monthlyTokenUsed: v.number(),
    monthlyResetAt: v.number(),
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
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_ownerId", ["ownerId"]),
});
