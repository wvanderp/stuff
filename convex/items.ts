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

async function withPhotoUrls(ctx: QueryCtx, item: Doc<"items">) {
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

// Query: Get all active (non-archived) items
export const list = query({
  handler: async (ctx) => {
    const items = await ctx.db
      .query("items")
      .withIndex("by_archived", (q) => q.eq("archivedAt", null))
      .collect();

    return await Promise.all(items.map((item) => withPhotoUrls(ctx, item)));
  },
});

// Query: Search items by text
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("items")
      .withSearchIndex("search_items", (q) => 
        q.search("title", args.query)
      )
      .filter((q) => q.eq(q.field("archivedAt"), null))
      .collect();

    return await Promise.all(items.map((item) => withPhotoUrls(ctx, item)));
  },
});

// Query: Get a single item by ID
export const get = query({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    return item === null ? null : await withPhotoUrls(ctx, item);
  },
});

// Query: Get an item by identifier (barcode/QR)
export const getByIdentifier = query({
  args: { identifier: v.string() },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("items")
      .collect();

    const item = items.find((item) => item.identifiers.includes(args.identifier));
    return item === undefined ? null : await withPhotoUrls(ctx, item);
  },
});

// Mutation: Create a new item
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    keywords: v.array(v.string()),
    photoStorageIds: v.array(v.string()),
    boxId: v.id("boxes"),
    identifiers: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const title = args.title.trim();
    if (!title && args.photoStorageIds.length === 0) {
      throw new Error("Item requires a name or at least one photo");
    }
    
    const heroPhotoStorageId = args.photoStorageIds.length > 0 
      ? args.photoStorageIds[0] 
      : null;
    
    return await ctx.db.insert("items", {
      title,
      description: args.description,
      keywords: args.keywords,
      heroPhotoStorageId,
      photoStorageIds: args.photoStorageIds,
      boxId: args.boxId,
      identifiers: args.identifiers,
      archivedAt: null,
    });
  },
});

// Mutation: Update an item
export const update = mutation({
  args: {
    id: v.id("items"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    keywords: v.optional(v.array(v.string())),
    heroPhotoStorageId: v.optional(v.union(v.string(), v.null())),
    photoStorageIds: v.optional(v.array(v.string())),
    boxId: v.optional(v.id("boxes")),
    identifiers: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Mutation: Add a keyword to an item
export const addKeyword = mutation({
  args: {
    id: v.id("items"),
    keyword: v.string(),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item not found");
    
    if (!item.keywords.includes(args.keyword)) {
      await ctx.db.patch(args.id, {
        keywords: [...item.keywords, args.keyword],
      });
    }
  },
});

// Mutation: Remove a keyword from an item
export const removeKeyword = mutation({
  args: {
    id: v.id("items"),
    keyword: v.string(),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item not found");
    
    await ctx.db.patch(args.id, {
      keywords: item.keywords.filter((k) => k !== args.keyword),
    });
  },
});

// Mutation: Add an identifier to an item
export const addIdentifier = mutation({
  args: {
    id: v.id("items"),
    identifier: v.string(),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item not found");
    
    if (!item.identifiers.includes(args.identifier)) {
      await ctx.db.patch(args.id, {
        identifiers: [...item.identifiers, args.identifier],
      });
    }
  },
});

// Mutation: Soft delete (archive) an item
export const archive = mutation({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      archivedAt: Date.now(),
    });
  },
});

// Mutation: Restore an archived item
export const restore = mutation({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      archivedAt: null,
    });
  },
});

// Mutation: Move item to a different box
export const moveToBox = mutation({
  args: {
    id: v.id("items"),
    boxId: v.id("boxes"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      boxId: args.boxId,
    });
  },
});
