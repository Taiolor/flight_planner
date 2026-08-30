import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Fly.IA widget", () => {
  const source = readFileSync(
    resolve(process.cwd(), "client/src/components/FlyIA.tsx"),
    "utf8"
  );

  it("is global, protects data access and connects to the chat procedure", () => {
    expect(source).toContain("trpc.flightAuth.check.useQuery");
    expect(source).toContain("trpc.flyIa.chat.useMutation");
    expect(source).toContain("if (!isInternalSessionAuthenticated)");
    expect(source).toContain("Entre para consultar o seu planejamento com o Fly.IA.");
  });

  it("describes the dialog close action for mouse and assistive technology", () => {
    expect(source).toContain('aria-label="Fechar Fly.IA"');
    expect(source).toContain('title="Fechar Fly.IA"');
  });

  it("keeps the trigger discreet and the dialog responsive", () => {
    expect(source).toContain("fixed bottom-4 right-4 z-40");
    expect(source).toContain("sm:w-[430px]");
    expect(source).toContain("h-[min(660px,calc(100dvh-6.5rem))]");
    expect(source).toContain("aria-label=\"Abrir Fly.IA\"");
  });
});
