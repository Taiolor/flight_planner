import { describe, expect, it } from "vitest";
import {
  getContentSecurityPolicy,
  productionCspDirectives,
} from "./contentSecurityPolicy";

describe("contentSecurityPolicy", () => {
  it("desabilita a CSP somente no desenvolvimento", () => {
    expect(getContentSecurityPolicy(true)).toBe(false);
    expect(getContentSecurityPolicy(false)).toEqual({
      directives: productionCspDirectives,
    });
  });

  it("bloqueia scripts inline e eval em produção", () => {
    expect(productionCspDirectives.scriptSrc).not.toContain("'unsafe-inline'");
    expect(productionCspDirectives.scriptSrc).not.toContain("'unsafe-eval'");
  });

  it("restringe incorporação, conexões e conteúdos de terceiros a allowlists", () => {
    expect(productionCspDirectives.frameAncestors).toEqual(["'self'"]);
    expect(productionCspDirectives.connectSrc).not.toContain("https:");
    expect(productionCspDirectives.connectSrc).not.toContain("http:");
    expect(productionCspDirectives.connectSrc).not.toContain("ws:");
    expect(productionCspDirectives.connectSrc).not.toContain("wss:");
    expect(productionCspDirectives.frameSrc).not.toContain("*");
    expect(productionCspDirectives.imgSrc).not.toContain("https:");
    expect(productionCspDirectives.imgSrc).toContain(
      "https://*.tile.openstreetmap.org"
    );
  });

  it("não permite blocos de estilo inline em produção", () => {
    expect(productionCspDirectives.styleSrc).not.toContain("'unsafe-inline'");
  });
});
