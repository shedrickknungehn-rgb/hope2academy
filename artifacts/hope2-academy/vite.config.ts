import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import fs from "fs";

// Map asset JSON filenames (without .asset.json) to local fallback images.
// The Lovable CDN is inaccessible from Replit, so we use the bundled images.
const ASSET_FALLBACKS: Record<string, string> = {
  // Hope/dept/stories images
  "dept-mission.jpg":         "/src/assets/hope/dept-outreach-BqPAShO5.jpg",
  "dept-academy.jpg":         "/src/assets/hope/dept-education-aYewL80F.jpg",
  "dept-church.jpg":          "/src/assets/hope/banner-1-CIHbaCOS.jpg",
  "dept-media.jpg":           "/src/assets/hope/dept-community-DR-ZUlx6.jpg",
  "hope2-logo.png":           "/src/assets/hope/team-1-Bn-q5HvV.jpg",
  // Hero slides (5 slides → 5 distinct images)
  "IMG-20260521-WA0022-2.jpg": "/src/assets/hope/dept-education-aYewL80F.jpg",
  "IMG-20260521-WA0000.jpg":   "/src/assets/hope/banner-1-CIHbaCOS.jpg",
  "IMG-20260521-WA0003-2.jpg": "/src/assets/hope/dept-health-xwwilth4.jpg",
  "IMG-20260521-WA0006.jpg":   "/src/assets/hope/dept-outreach-BqPAShO5.jpg",
  "IMG-20260521-WA0012-2.jpg": "/src/assets/hope/dept-community-DR-ZUlx6.jpg",
  // Upload images
  "IMG-20260521-WA0012.jpg":  "/src/assets/hope/story-classroom-D9IJEfzp.jpg",
  "IMG-20260521-WA0031.jpg":  "/src/assets/hope/story-well-6CEMCBHm.jpg",
  "IMG-20260521-WA0022.jpg":  "/src/assets/hope/story-clinic-DsVCT660.jpg",
  "IMG-20260521-WA0003.jpg":  "/src/assets/hope/dept-outreach-BqPAShO5.jpg",
  "IMG-20260521-WA0018.jpg":  "/src/assets/hope/project-village-BG6QOkRo.jpg",
  "IMG-20260521-WA0017.jpg":  "/src/assets/hope/project-school-C5dtR3hs.jpg",
  "IMG-20260521-WA0027.jpg":  "/src/assets/hope/about-portrait-eKNmGVTA.jpg",
  "IMG-20260521-WA0040.jpg":  "/src/assets/hope/dept-health-xwwilth4.jpg",
  "IMG-20260521-WA0039.jpg":  "/src/assets/hope/dept-community-DR-ZUlx6.jpg",
  "IMG-20260521-WA0034.jpg":  "/src/assets/hope/banner-1-CIHbaCOS.jpg",
};

function lovableAssetPlugin(): Plugin {
  const srcAssetsHope = path.resolve(import.meta.dirname, "src/assets/hope");
  return {
    name: "lovable-asset-json",
    transform(_code, id) {
      if (!id.endsWith(".asset.json")) return null;
      try {
        const json = JSON.parse(fs.readFileSync(id, "utf-8"));
        const originalFilename: string = json.original_filename || path.basename(id, ".asset.json");
        const fallbackRelative = ASSET_FALLBACKS[originalFilename];
        if (fallbackRelative) {
          // Emit a real import so Vite processes the image correctly
          const absoluteFallback = path.resolve(srcAssetsHope, path.basename(fallbackRelative));
          return {
            code: `import __img from ${JSON.stringify(absoluteFallback)}; export default { ...${JSON.stringify(json)}, url: __img };`,
            map: null,
          };
        }
        return {
          code: `export default ${JSON.stringify({ ...json, url: json.url ?? "" })}`,
          map: null,
        };
      } catch {
        return null;
      }
    },
  };
}

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 5000;
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [
    lovableAssetPlugin(),
    react(),
    tailwindcss(),
    // Replit-specific dev plugins — excluded from production (VPS) builds so the
    // shipped bundle carries no Replit coupling.
    ...(process.env.NODE_ENV !== "production" ? [runtimeErrorOverlay()] : []),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
