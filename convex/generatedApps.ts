import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

type GeneratedRecord = {
  _id: string;
  buildId: string;
  model: string;
  entityId: string;
  data: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
};

function compareValue(left: unknown, operator: string, right: unknown) {
  switch (operator) {
    case "eq":
      return left === right;
    case "ne":
      return left !== right;
    case "lt":
      return typeof left === "number" && typeof right === "number" && left < right;
    case "lte":
      return typeof left === "number" && typeof right === "number" && left <= right;
    case "gt":
      return typeof left === "number" && typeof right === "number" && left > right;
    case "gte":
      return typeof left === "number" && typeof right === "number" && left >= right;
    case "in":
      return Array.isArray(right) && right.includes(left);
    case "not_in":
      return Array.isArray(right) && !right.includes(left);
    case "contains":
      return typeof left === "string" && typeof right === "string" && left.includes(right);
    case "starts_with":
      return typeof left === "string" && typeof right === "string" && left.startsWith(right);
    case "ends_with":
      return typeof left === "string" && typeof right === "string" && left.endsWith(right);
    default:
      return false;
  }
}

function matchesWhere(record: Record<string, unknown>, where: any) {
  if (!where) {
    return true;
  }

  if (Array.isArray(where)) {
    return where.every((clause) => compareValue(record[clause.field as string], clause.operator ?? "eq", clause.value));
  }

  return Object.entries(where).every(([field, value]) => record[field] === value);
}

function sortRows(rows: GeneratedRecord[], order: any) {
  if (!order || typeof order !== "object") {
    return rows;
  }

  const [field, direction] = Object.entries(order)[0] ?? [];
  if (!field) {
    return rows;
  }

  return [...rows].sort((left, right) => {
    const leftValue = left.data[field] ?? left[field as keyof GeneratedRecord];
    const rightValue = right.data[field] ?? right[field as keyof GeneratedRecord];

    if (leftValue === rightValue) {
      return 0;
    }

    const result = leftValue > rightValue ? 1 : -1;
    return direction === "desc" ? -result : result;
  });
}

async function requireOwnedBuild(ctx: any, buildId: any) {
  const user = await authComponent.getAuthUser(ctx);
  const build = await ctx.db.get(buildId);

  if (!user || !build || build.ownerId !== user._id) {
    throw new ConvexError("Build not found");
  }

  return build;
}

export const read = query({
  args: {
    buildId: v.id("builds"),
    query: v.any(),
  },
  handler: async (ctx, args) => {
    await requireOwnedBuild(ctx, args.buildId);

    const records = await ctx.db
      .query("generatedAppRecords")
      .withIndex("by_buildId", (q) => q.eq("buildId", args.buildId))
      .collect();

    const result: Record<string, Record<string, unknown>[]> = {};
    const querySpec = args.query ?? {};

    for (const [model, spec] of Object.entries(querySpec as Record<string, any>)) {
      const options = spec?.$ ?? {};
      const modelRows = records.filter((record) => record.model === model);
      const filteredRows = modelRows.filter((record) => matchesWhere(record.data, options.where));
      const orderedRows = sortRows(filteredRows as GeneratedRecord[], options.order);

      result[model] = orderedRows.map((record) => ({
        id: record.entityId,
        ...record.data,
      }));
    }

    return result;
  },
});

export const transact = mutation({
  args: {
    buildId: v.id("builds"),
    operations: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    await requireOwnedBuild(ctx, args.buildId);
    const now = Date.now();

    for (const operation of args.operations as any[]) {
      if (!operation || typeof operation !== "object") {
        continue;
      }

      if (operation.type === "create") {
        await ctx.db.insert("generatedAppRecords", {
          buildId: args.buildId,
          model: operation.model,
          entityId: operation.entityId,
          data: operation.data ?? {},
          createdAt: now,
          updatedAt: now,
        });
        continue;
      }

      const existing = await ctx.db
        .query("generatedAppRecords")
        .withIndex("by_buildId_model_entityId", (q) =>
          q.eq("buildId", args.buildId).eq("model", operation.model).eq("entityId", operation.entityId)
        )
        .first();

      if (!existing) {
        if (operation.type === "update") {
          await ctx.db.insert("generatedAppRecords", {
            buildId: args.buildId,
            model: operation.model,
            entityId: operation.entityId,
            data: operation.data ?? {},
            createdAt: now,
            updatedAt: now,
          });
        }
        continue;
      }

      if (operation.type === "update") {
        await ctx.db.patch(existing._id, {
          data: {
            ...(existing.data ?? {}),
            ...(operation.data ?? {}),
          },
          updatedAt: now,
        });
      }

      if (operation.type === "delete") {
        await ctx.db.delete(existing._id);
      }
    }

    return { ok: true };
  },
});
