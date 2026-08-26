import { describe, expect, it } from "vitest";
import {
  buildNotificationLogSearchPattern,
  normalizeNotificationLogSearch,
} from "./notificationLogSearch";

describe("notificationLogSearch", () => {
  it("normaliza espaços e descarta termos vazios", () => {
    expect(normalizeNotificationLogSearch("  erro   de   token  ")).toBe("erro de token");
    expect(normalizeNotificationLogSearch("   ")).toBeUndefined();
  });

  it("escapa curingas do LIKE sem perder a pesquisa livre", () => {
    expect(buildNotificationLogSearchPattern("LA_100%"))
      .toBe("%LA\\_100\\%%");
  });
});
