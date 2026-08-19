import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("FlightQuotes mobile responsiveness", () => {
  const source = readFileSync(
    resolve(process.cwd(), "client/src/pages/FlightQuotes.tsx"),
    "utf8"
  );

  it("stacks flight-detail columns until a comfortable mobile width", () => {
    expect(source).toContain("grid-cols-1 min-[380px]:grid-cols-2");
  });

  it("keeps weekly badges compact and prevents the current-week label from overflowing", () => {
    expect(source).toContain("flex shrink-0 items-center gap-1 whitespace-nowrap");
    expect(source).toContain("hidden min-[360px]:inline");
  });
});
