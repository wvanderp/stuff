import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query: Get all boxes
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("boxes").collect();
  },
});

// Query: Get a single box by ID
export const get = query({
  args: { id: v.id("boxes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Query: Get a box by identifier (barcode/QR)
export const getByIdentifier = query({
  args: { identifier: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("boxes")
      .withIndex("by_identifier", (q) => q.eq("identifier", args.identifier))
      .first();
  },
});

// Query: Get all items in a box
export const getItems = query({
  args: { boxId: v.id("boxes") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("items")
      .withIndex("by_box", (q) => q.eq("boxId", args.boxId))
      .filter((q) => q.eq(q.field("archivedAt"), null))
      .collect();
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
