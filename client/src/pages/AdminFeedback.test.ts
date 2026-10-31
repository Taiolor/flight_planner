import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Administrative feedback experience", () => {
  const source = readFileSync(
    resolve(process.cwd(), "client/src/pages/AdminNotifications.tsx"),
    "utf8"
  );

  it("keeps visible, announced feedback for push and email form results", () => {
    expect(source).toContain("const [testFeedback, setTestFeedback]");
    expect(source).toContain("const [emailFeedback, setEmailFeedback]");
    expect(source).toContain('role="status"');
    expect(source).toContain('aria-live="polite"');
  });

  it("renders an animated loading placeholder while the admin panel loads", () => {
    expect(source).toContain("animate-pulse");
    expect(source).toContain("Carregando painel e histórico...");
  });
});
