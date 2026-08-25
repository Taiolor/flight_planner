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
    expect(manifest).toContain("/manus-storage/smartfly-sf-pwa-icon_783c04c6.webp");
    expect(manifest).toContain('"type": "image/webp"');
    expect(document).toContain("smartfly-icon-512-fy4eDuGdVJBtxeYLKc2qAk.png");
    expect(document).toContain("/manus-storage/smartfly-sf-apple-touch-icon_598faae4.png");
    expect(document).toContain('apple-mobile-web-app-title" content="Viagens"');
  });
});
