import { ConvexError, v } from "convex/values";
import { internalQuery } from "./_generated/server";

export const getOwnedBuildInternal = internalQuery({
  args: {
    buildId: v.id("builds"),
    ownerId: v.string(),
  },
  handler: async (ctx, args) => {
    const build = await ctx.db.get(args.buildId);
    if (!build || build.ownerId !== args.ownerId) {
      return null;
    }
    return build;
  },
});

export const assertBuildOwnership = internalQuery({
  args: {
    buildId: v.id("builds"),
    ownerId: v.string(),
  },
  handler: async (ctx, args) => {
    const build = await ctx.db.get(args.buildId);
    if (!build || build.ownerId !== args.ownerId) {
      throw new ConvexError("Build not found");
    }
    return build;
  },
});
