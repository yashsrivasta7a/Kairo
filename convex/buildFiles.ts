import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";
import { authComponent } from "./auth";

type BuildCodeResult = {
  code: string;
  storageId: Id<"_storage"> | null;
} | null;

export const getCodeForCurrentUser = action({
  args: { buildId: v.id("builds") },
  handler: async (ctx, args): Promise<BuildCodeResult> => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Unauthenticated");
    }

    const build: {
      code?: string;
      storageId?: Id<"_storage">;
    } = await ctx.runQuery(internal.buildAccess.assertBuildOwnership, {
      buildId: args.buildId,
      ownerId: user._id,
    });

    if (!build.storageId) {
      return build.code ? { code: build.code, storageId: null } : null;
    }

    const blob = await ctx.storage.get(build.storageId);
    if (!blob) {
      throw new ConvexError("Code file not found");
    }

    return {
      code: await blob.text(),
      storageId: build.storageId,
    };
  },
});
