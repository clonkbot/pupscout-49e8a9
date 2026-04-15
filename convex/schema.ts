import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  dogIdentifications: defineTable({
    userId: v.id("users"),
    imageBase64: v.string(),
    breed: v.string(),
    confidence: v.string(),
    description: v.string(),
    characteristics: v.array(v.string()),
    funFact: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
