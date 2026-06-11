/**
 * PostgreSQL-backed store. Implements the same interface as mock-store.ts
 * so routes can swap the import with zero logic changes.
 *
 * Users live in the `users` table (structured).
 * Everything else lives in the `items` table (collection + JSONB).
 */
import { db } from "@workspace/db";
import { usersTable, itemsTable, APP_ROLES } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { AppRole } from "@workspace/db/schema";

export { APP_ROLES };
export type { AppRole };

const BCRYPT_ROUNDS = 10;
/** True if a stored password is already a bcrypt hash (vs a legacy plaintext value). */
function isBcryptHash(pw: string): boolean {
  return typeof pw === "string" && /^\$2[aby]\$/.test(pw);
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: AppRole;
  avatar?: string | null;
  phone?: string | null;
  address?: string | null;
  bio?: string | null;
  date_of_birth?: string | null;
  emergency_contact?: string | null;
  grade?: string | null;
  class_name?: string | null;
  department?: string | null;
  subjects?: string[] | null;
  graduation_year?: number | null;
  linked_children?: string[] | null;
  createdAt: string;
}

function rowToUser(row: typeof usersTable.$inferSelect): User {
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    name: row.name,
    role: row.role,
    avatar: row.avatar ?? null,
    phone: row.phone ?? null,
    address: row.address ?? null,
    bio: row.bio ?? null,
    date_of_birth: row.date_of_birth ?? null,
    emergency_contact: row.emergency_contact ?? null,
    grade: row.grade ?? null,
    class_name: row.class_name ?? null,
    department: row.department ?? null,
    subjects: row.subjects ?? null,
    graduation_year: row.graduation_year != null ? Number(row.graduation_year) : null,
    linked_children: row.linked_children ?? null,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

export const dbStore = {
  async list<T = any>(col: string): Promise<T[]> {
    const rows = await db
      .select()
      .from(itemsTable)
      .where(eq(itemsTable.collection, col));
    return rows.map((r) => r.data as T);
  },

  async get<T = any>(col: string, id: string): Promise<T | null> {
    const rows = await db
      .select()
      .from(itemsTable)
      .where(and(eq(itemsTable.collection, col), eq(itemsTable.id, id)));
    return rows.length ? (rows[0].data as T) : null;
  },

  async create<T extends { id?: string }>(col: string, item: T): Promise<T> {
    const withId = {
      ...item,
      id: item.id ?? `${col}_${Math.random().toString(36).slice(2, 9)}`,
    } as T & { id: string };
    await db.insert(itemsTable).values({
      collection: col,
      id: withId.id,
      data: withId as any,
    });
    return withId;
  },

  async update<T extends { id: string }>(col: string, id: string, patch: Partial<T>): Promise<T | null> {
    const existing = await this.get<T>(col, id);
    if (!existing) return null;
    const updated = { ...existing, ...patch } as T;
    await db
      .update(itemsTable)
      .set({ data: updated as any, updatedAt: new Date() })
      .where(and(eq(itemsTable.collection, col), eq(itemsTable.id, id)));
    return updated;
  },

  async remove(col: string, id: string): Promise<boolean> {
    const result = await db
      .delete(itemsTable)
      .where(and(eq(itemsTable.collection, col), eq(itemsTable.id, id)));
    return (result.rowCount ?? 0) > 0;
  },

  /** Insert-or-update an item with a fixed id (used for singletons like brand/nav/team). */
  async upsert<T extends Record<string, any>>(col: string, id: string, data: T): Promise<T & { id: string }> {
    const existing = await this.get<Record<string, any>>(col, id);
    const merged = { ...(existing ?? {}), ...data, id } as T & { id: string };
    if (existing) {
      await db
        .update(itemsTable)
        .set({ data: merged as any, updatedAt: new Date() })
        .where(and(eq(itemsTable.collection, col), eq(itemsTable.id, id)));
    } else {
      await db.insert(itemsTable).values({ collection: col, id, data: merged as any });
    }
    return merged;
  },

  /** Verify a plaintext password against the stored hash (legacy plaintext fallback). */
  async verifyPassword(plain: string, stored: string): Promise<boolean> {
    if (isBcryptHash(stored)) return bcrypt.compare(plain, stored);
    return plain === stored;
  },

  async listUsers(): Promise<User[]> {
    const rows = await db.select().from(usersTable);
    return rows.map(rowToUser);
  },

  async findUserByEmail(email: string): Promise<User | null> {
    const rows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()));
    return rows.length ? rowToUser(rows[0]) : null;
  },

  async findUserById(id: string): Promise<User | null> {
    const rows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));
    return rows.length ? rowToUser(rows[0]) : null;
  },

  async createUser(user: User): Promise<User> {
    const password = isBcryptHash(user.password)
      ? user.password
      : await bcrypt.hash(user.password, BCRYPT_ROUNDS);
    await db.insert(usersTable).values({
      id: user.id,
      email: user.email.toLowerCase(),
      password,
      name: user.name,
      role: user.role,
      avatar: user.avatar ?? null,
      phone: user.phone ?? null,
      address: user.address ?? null,
      bio: user.bio ?? null,
      date_of_birth: user.date_of_birth ?? null,
      emergency_contact: user.emergency_contact ?? null,
      grade: user.grade ?? null,
      class_name: user.class_name ?? null,
      department: user.department ?? null,
      subjects: user.subjects ?? null,
      graduation_year: user.graduation_year != null ? String(user.graduation_year) : null,
      linked_children: user.linked_children ?? null,
    });
    return { ...user, password };
  },

  async updateUser(id: string, patch: Partial<User>): Promise<User | null> {
    const existing = await this.findUserById(id);
    if (!existing) return null;
    const { id: _id, createdAt: _c, ...updateFields } = patch as any;
    const cleanPatch: Record<string, any> = {};
    if (updateFields.email != null) cleanPatch.email = updateFields.email.toLowerCase();
    if (updateFields.password != null) cleanPatch.password = isBcryptHash(updateFields.password) ? updateFields.password : await bcrypt.hash(updateFields.password, BCRYPT_ROUNDS);
    if (updateFields.name != null) cleanPatch.name = updateFields.name;
    if (updateFields.role != null) cleanPatch.role = updateFields.role;
    if ("avatar" in updateFields) cleanPatch.avatar = updateFields.avatar ?? null;
    if ("phone" in updateFields) cleanPatch.phone = updateFields.phone ?? null;
    if ("address" in updateFields) cleanPatch.address = updateFields.address ?? null;
    if ("bio" in updateFields) cleanPatch.bio = updateFields.bio ?? null;
    if ("date_of_birth" in updateFields) cleanPatch.date_of_birth = updateFields.date_of_birth ?? null;
    if ("emergency_contact" in updateFields) cleanPatch.emergency_contact = updateFields.emergency_contact ?? null;
    if ("grade" in updateFields) cleanPatch.grade = updateFields.grade ?? null;
    if ("class_name" in updateFields) cleanPatch.class_name = updateFields.class_name ?? null;
    if ("department" in updateFields) cleanPatch.department = updateFields.department ?? null;
    if ("subjects" in updateFields) cleanPatch.subjects = updateFields.subjects ?? null;
    if ("graduation_year" in updateFields) cleanPatch.graduation_year = updateFields.graduation_year != null ? String(updateFields.graduation_year) : null;
    if ("linked_children" in updateFields) cleanPatch.linked_children = updateFields.linked_children ?? null;
    if (Object.keys(cleanPatch).length > 0) {
      await db.update(usersTable).set(cleanPatch).where(eq(usersTable.id, id));
    }
    return this.findUserById(id);
  },

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(usersTable).where(eq(usersTable.id, id));
    return (result.rowCount ?? 0) > 0;
  },
};
