/**
 * Appwrite client — single source of truth for backend config.
 *
 * ⚠️  YOU MUST FILL IN `PROJECT_ID` BELOW WITH YOUR APPWRITE PROJECT ID.
 * Find it in the Appwrite Console → Settings → Project ID.
 *
 * Then create the collections & buckets per APPWRITE_SETUP.md.
 */
import { Client, Account, Databases, Storage, ID, Query, Permission, Role } from "appwrite";

export const APPWRITE = {
  endpoint: "https://fra.cloud.appwrite.io/v1",
  projectId: "REPLACE_WITH_YOUR_APPWRITE_PROJECT_ID",
  // Database & collection / bucket IDs (see APPWRITE_SETUP.md)
  databaseId: "hope2_main",
  collections: {
    profiles: "profiles",
    cmsPages: "cms_pages",
    cmsPosts: "cms_posts",
  },
  buckets: {
    media: "media",
    avatars: "avatars",
  },
};

export const client = new Client()
  .setEndpoint(APPWRITE.endpoint)
  .setProject(APPWRITE.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export { ID, Query, Permission, Role };

export const APP_ROLES = ["superadmin", "admin", "teacher", "student", "parent", "alumni"] as const;
export type AppRole = typeof APP_ROLES[number];

export const ROLE_LABEL: Record<AppRole, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
  alumni: "Alumni",
};

export function avatarUrl(fileId?: string | null) {
  if (!fileId) return null;
  return storage.getFileView(APPWRITE.buckets.avatars, fileId).toString();
}

export function mediaUrl(fileId?: string | null) {
  if (!fileId) return null;
  return storage.getFileView(APPWRITE.buckets.media, fileId).toString();
}