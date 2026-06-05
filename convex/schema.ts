import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  items: defineTable({
    title: v.string(),
    description: v.string(),
    keywords: v.array(v.string()),
    heroPhotoStorageId: v.union(v.string(), v.null()),
    photoStorageIds: v.array(v.string()),
    boxId: v.id("boxes"),
    identifiers: v.array(v.string()),
    archivedAt: v.union(v.number(), v.null()),
  })
    .index("by_box", ["boxId"])
    .index("by_archived", ["archivedAt"])
    .searchIndex("search_items", {
      searchField: "title",
      filterFields: ["archivedAt"],
    }),

  boxes: defineTable({
    name: v.string(),
    description: v.string(),
    photoStorageId: v.union(v.string(), v.null()),
    identifier: v.string(),
  }).index("by_identifier", ["identifier"]),

  notes: defineTable({
    itemId: v.id("items"),
    text: v.string(),
    photoStorageIds: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_item", ["itemId", "createdAt"]),
});
