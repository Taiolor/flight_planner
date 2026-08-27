import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("PWA Viagens branding", () => {
  it("exposes Viagens with the same official SF icon used by the site", () => {
    const manifest = readFileSync(
      resolve(process.cwd(), "client/public/manifest.json"),
      "utf8"
    );
    const document = readFileSync(
      resolve(process.cwd(), "client/index.html"),
      "utf8"
    );

    expect(manifest).toContain('"name": "Viagens"');
    expect(manifest).toContain('"short_name": "Viagens"');
    expect(manifest).toContain("/manus-storage/smartfly-sf-pwa-icon_783c04c6.webp?v=20260826");
    expect(manifest).toContain('"type": "image/webp"');
    expect(manifest).toContain('"purpose": "any maskable"');
    expect(document).toContain('/manifest.json?v=20260826');
    expect(document).toContain('name="color-scheme" content="light dark"');
    expect(document).toContain("@media (prefers-color-scheme: dark)");
    expect(document).toContain("smartfly-sf-apple-touch-icon_598faae4.png?v=20260827");
    expect(document).toContain("/manus-storage/smartfly-sf-apple-touch-icon_598faae4.png?v=20260826");
    expect(document).toContain("/manus-storage/smartfly-sf-favicon-48_45731084.png?v=20260826");
    expect(document).toContain("/manus-storage/smartfly-sf-favicon-32_fa912500.png?v=20260826");
    expect(document).toContain("/manus-storage/smartfly-sf-favicon-16_8b3260d7.png?v=20260826");
    expect(document).toContain('apple-mobile-web-app-title" content="Viagens"');
  });
});
