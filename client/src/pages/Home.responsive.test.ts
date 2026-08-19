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
});
