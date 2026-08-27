import { describe, expect, it } from "vitest";
import { getSafeStorageContentType, getStorageCacheControl } from "./storageProxy";

describe("storageProxy", () => {
  it("marca os ativos visuais versionados como cacheáveis no mesmo domínio", () => {
    expect(getStorageCacheControl("smartfly-airline-latam_c982c0a8.png")).toBe(
      "public, max-age=604800, immutable"
    );
    expect(getStorageCacheControl("smartfly-sf-pwa-icon_783c04c6.webp")).toBe(
      "public, max-age=604800, immutable"
    );
  });

  it("mantém conteúdo não institucional fora do cache público", () => {
    expect(getStorageCacheControl("flight-memories/2026/27/photo.png")).toBe("private, no-store");
  });

  it("preserva MIME de imagem válido e rejeita valores inseguros", () => {
    expect(getSafeStorageContentType("image/png; charset=binary")).toBe("image/png");
    expect(getSafeStorageContentType("image/webp")).toBe("image/webp");
    expect(getSafeStorageContentType("image/png\r\nX-Injected: true")).toBe(
      "application/octet-stream"
    );
    expect(getSafeStorageContentType(null)).toBe("application/octet-stream");
  });
});
