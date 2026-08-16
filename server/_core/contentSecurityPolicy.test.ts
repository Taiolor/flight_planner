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
});
