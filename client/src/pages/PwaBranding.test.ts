import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("PWA Viagens branding", () => {
  it("exposes Viagens as the installable app name with the dedicated icon", () => {
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
    expect(manifest).toContain("/manus-storage/viagens-pwa-icon_9fa8e578.png");
    expect(document).toContain('apple-mobile-web-app-title" content="Viagens"');
  });
});
