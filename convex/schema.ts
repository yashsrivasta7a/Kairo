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
    code: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    status: buildStatus,
    stage: buildStage,
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
});
