import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

async function getStorageUrl(ctx: QueryCtx, storageId: string | null) {
  if (storageId === null) {
    return null;
  }

  return await ctx.storage.getUrl(storageId as Id<"_storage">);
}

async function withPhotoUrl(ctx: QueryCtx, box: Doc<"boxes">) {
  return {
    ...box,
    photoUrl: await getStorageUrl(ctx, box.photoStorageId),
  };
}

async function withItemPhotoUrls(ctx: QueryCtx, item: Doc<"items">) {
  const photoUrls = await Promise.all(
    item.photoStorageIds.map(async (storageId) => ({
      storageId,
      url: await getStorageUrl(ctx, storageId),
    })),
  );

  return {
    ...item,
    heroPhotoUrl: await getStorageUrl(ctx, item.heroPhotoStorageId),
    photoUrls,
  };
}

// Query: Get all boxes
export const list = query({
  handler: async (ctx) => {
    const boxes = await ctx.db.query("boxes").collect();
    return await Promise.all(boxes.map((box) => withPhotoUrl(ctx, box)));
  },
});

// Query: Get a single box by ID
export const get = query({
  args: { id: v.id("boxes") },
  handler: async (ctx, args) => {
    const box = await ctx.db.get(args.id);
    return box === null ? null : await withPhotoUrl(ctx, box);
  },
});

// Query: Get a box by identifier (barcode/QR)
export const getByIdentifier = query({
  args: { identifier: v.string() },
  handler: async (ctx, args) => {
    const box = await ctx.db
      .query("boxes")
      .withIndex("by_identifier", (q) => q.eq("identifier", args.identifier))
      .first();

    return box === null ? null : await withPhotoUrl(ctx, box);
  },
});

// Query: Resolve scanned box text by document ID, identifier, or name
export const getByScannedValue = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const code = args.code.trim();
    if (!code) {
      return null;
    }

    const normalizedId = ctx.db.normalizeId("boxes", code);
    if (normalizedId !== null) {
      const boxById = await ctx.db.get(normalizedId);
      if (boxById !== null) {
        return await withPhotoUrl(ctx, boxById);
      }
    }

    const boxByIdentifier = await ctx.db
      .query("boxes")
      .withIndex("by_identifier", (q) => q.eq("identifier", code))
      .first();

    if (boxByIdentifier !== null) {
      return await withPhotoUrl(ctx, boxByIdentifier);
    }

    const boxByName = await ctx.db
      .query("boxes")
      .withIndex("by_name", (q) => q.eq("name", code))
      .first();

    return boxByName === null ? null : await withPhotoUrl(ctx, boxByName);
  },
});

// Query: Get all items in a box
export const getItems = query({
  args: { boxId: v.id("boxes") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("items")
      .withIndex("by_box", (q) => q.eq("boxId", args.boxId))
      .filter((q) => q.eq(q.field("archivedAt"), null))
      .collect();

    return await Promise.all(items.map((item) => withItemPhotoUrls(ctx, item)));
  },
});

// Mutation: Create a new box
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    photoStorageId: v.union(v.string(), v.null()),
    identifier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identifier = args.identifier?.trim() || crypto.randomUUID();
    const existingBox = await ctx.db
      .query("boxes")
      .withIndex("by_identifier", (q) => q.eq("identifier", identifier))
      .first();

    if (existingBox) {
      throw new Error(`Box with identifier ${identifier} already exists`);
    }
    
    return await ctx.db.insert("boxes", {
      name: args.name,
      description: args.description,
      photoStorageId: args.photoStorageId,
      identifier,
    });
  },
});

// Mutation: Update a box
export const update = mutation({
  args: {
    id: v.id("boxes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    photoStorageId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Mutation: Delete a box (only if empty)
export const remove = mutation({
  args: { id: v.id("boxes") },
  handler: async (ctx, args) => {
    // Check if box has items
    const items = await ctx.db
      .query("items")
      .withIndex("by_box", (q) => q.eq("boxId", args.id))
      .filter((q) => q.eq(q.field("archivedAt"), null))
      .first();
    
    if (items) {
      throw new Error("Cannot delete a box that contains items");
    }
    
    await ctx.db.delete(args.id);
  },
});
