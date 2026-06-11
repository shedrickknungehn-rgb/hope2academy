import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const APP_ROLES = ["superadmin", "admin", "teacher", "student", "parent", "alumni"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().$type<AppRole>(),
  avatar: text("avatar"),
  phone: text("phone"),
  address: text("address"),
  bio: text("bio"),
  date_of_birth: text("date_of_birth"),
  emergency_contact: text("emergency_contact"),
  grade: text("grade"),
  class_name: text("class_name"),
  department: text("department"),
  subjects: text("subjects").array(),
  graduation_year: text("graduation_year"),
  linked_children: text("linked_children").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
