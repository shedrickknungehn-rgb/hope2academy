import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

/**
 * Generic JSONB store for all non-user collections.
 * Each row = one item in a named collection.
 */
export const itemsTable = pgTable("items", {
  collection: text("collection").notNull(),
  id: text("id").notNull(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
