// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    channel: v.id("channels"),
    body: v.string(),
    author: v.string(), // or v.id("users"), depending on your data model
  }).index("by_author", ["author"]),
});