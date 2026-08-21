import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Home mobile responsiveness", () => {
  const source = readFileSync(
    resolve(process.cwd(), "client/src/pages/Home.tsx"),
    "utf8"
  );

  it("keeps the filters in one column until a comfortable mobile width", () => {
    expect(source).toContain("grid-cols-1 min-[480px]:grid-cols-2");
    expect(source).toContain("[&>div]:min-w-0");
  });

  it("allows graph actions and empty-state buttons to wrap on small screens", () => {
    expect(source).toContain("flex flex-col gap-2 sm:flex-row");
    expect(source).toContain("max-w-full whitespace-normal");
  });

  it("usa azul-marinho e textos neutros no Resumo Anual", () => {
    expect(source).toContain("via-[#071a36]");
    expect(source).toContain("bg-gradient-to-br from-[#071a36] via-[#102f61] to-[#17427e]");
    expect(source).toContain("text-slate-300 text-[10px] sm:text-xs uppercase");
    expect(source).not.toContain("border border-blue-300 border-dashed text-blue-100");
  });
});
