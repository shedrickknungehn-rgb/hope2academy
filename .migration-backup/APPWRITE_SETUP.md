# Appwrite Setup — HOPE2-LIBERIA

Your app now uses Appwrite for auth, database, and storage. Follow these steps **before signing in** — otherwise the app will throw errors.

## 1. Paste your Project ID

Open `src/integrations/appwrite/client.ts` and replace `REPLACE_WITH_YOUR_APPWRITE_PROJECT_ID` with your real Appwrite Project ID (Console → Settings → Project ID).

Endpoint is already set to `https://fra.cloud.appwrite.io/v1` (Frankfurt). Change if you self-host.

## 2. Add Web Platform

Console → **Settings → Platforms → Add platform → Web app**
- Name: `HOPE2-LIBERIA`
- Hostname: add **both** your preview hostname (`*.lovable.app`) and your production hostname.

## 3. Create the database

Console → **Databases → Create database**
- Database ID: `hope2_main`
- Name: `HOPE2 Main`

## 4. Create the `profiles` collection

Inside `hope2_main` → **Create collection**
- Collection ID: `profiles`
- **Document Security:** ON
- **Permissions (Collection-level):**
  - Read: `Any` (so public profile basics can be read) — or `Users` if you want stricter
  - Create: `Users`
  - Update / Delete: `Users` (per-doc permissions handle who can do what)

### Attributes

| Key | Type | Size | Required | Default | Array |
|---|---|---|---|---|---|
| `userId` | String | 64 | ✓ | — | — |
| `email` | Email | — | ✓ | — | — |
| `full_name` | String | 255 | — | — | — |
| `avatar_url` | String | 512 | — | — | — |
| `phone` | String | 32 | — | — | — |
| `address` | String | 512 | — | — | — |
| `bio` | String | 2000 | — | — | — |
| `date_of_birth` | String | 32 | — | — | — |
| `emergency_contact` | String | 255 | — | — | — |
| `grade` | String | 32 | — | — | — |
| `class_name` | String | 64 | — | — | — |
| `department` | String | 64 | — | — | — |
| `subjects` | String | 64 | — | — | ✓ |
| `graduation_year` | Integer | — | — | — | — |
| `linked_children` | String | 64 | — | — | ✓ |
| `role` | Enum (`superadmin`,`admin`,`teacher`,`student`,`parent`,`alumni`) | — | ✓ | `alumni` | — |

### Indexes

- `idx_role` — key, on `role`
- `idx_email` — key, on `email`

## 5. Create storage buckets

Console → **Storage → Create bucket**

| Bucket ID | Name | Permissions |
|---|---|---|
| `avatars` | Avatars | Read: Any · Create/Update: Users |
| `media` | Media Library | Read: Any · Create/Update/Delete: Users (restrict to admins later) |

## 6. Create the first user (admin-invite only — no public signup)

Console → **Auth → Users → Create user**
- Email + password.
- After creation, copy the **User ID**.

Console → **Databases → hope2_main → profiles → Create document**
- Document ID: paste the User ID from above (must match exactly).
- `userId`: paste the same User ID.
- `email`, `full_name`: fill in.
- `role`: `superadmin`.

Now sign in at `/login`. The superadmin can then change any other user's role from the **Admin → User Management** screen.

## 7. Adding more users

For now (Phase 1) admins create users in the Appwrite Console (step 6 pattern). A "Send invite from app" button + Appwrite Functions integration will come in Phase 2 along with the CMS and Media Library UI.

## Coming in Phase 2

- CMS UI (Pages, Posts/Stories) backed by `cms_pages` and `cms_posts` collections.
- Media Library UI backed by the `media` bucket.
- Site settings.
- In-app user invite (calls Appwrite Functions with the server API key).