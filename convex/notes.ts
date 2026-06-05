import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query: Get all notes for an item (newest first)
export const listByItem = query({
  args: { itemId: v.id("items") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .order("desc")
      .collect();
  },
});

// Query: Get a single note by ID
export const get = query({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Mutation: Create a new note
export const create = mutation({
  args: {
    itemId: v.id("items"),
    text: v.string(),
    photoStorageIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notes", {
      itemId: args.itemId,
      text: args.text,
      photoStorageIds: args.photoStorageIds,
      createdAt: Date.now(),
    });
  },
});

// Mutation: Update a note
export const update = mutation({
  args: {
    id: v.id("notes"),
    text: v.optional(v.string()),
    photoStorageIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Mutation: Delete a note
export const remove = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
