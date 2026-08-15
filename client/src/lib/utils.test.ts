import { describe, it, expect } from "vitest";
import { cn, toIsoDate } from "./utils";

describe("cn utility", () => {
  it("merges basic class names", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  it("handles object conditionals", () => {
    expect(cn("base", { active: true, inactive: false })).toBe("base active");
  });

  it("handles array inputs", () => {
    expect(cn("base", ["array1", "array2"])).toBe("base array1 array2");
  });

  it("ignores falsy values", () => {
    expect(cn("base", null, undefined, false, 0, "")).toBe("base");
  });

  it("merges tailwind classes correctly", () => {
    // twMerge logic: later classes override earlier ones with the same utility prefix
    expect(cn("px-2 py-1", "p-4")).toBe("p-4");
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });

  it("combines all features", () => {
    expect(
      cn(
        "base-class",
        { "bg-red-500": false, "bg-blue-500": true },
        ["p-2", "m-2"],
        "p-4",
        undefined,
        null
      )
    ).toBe("base-class bg-blue-500 m-2 p-4");
  });
});

describe("toIsoDate utility", () => {
  it("converts DD/MM/YYYY to YYYY-MM-DD", () => {
    expect(toIsoDate("15/08/2023")).toBe("2023-08-15");
  });

  it("pads single digit days and months", () => {
    expect(toIsoDate("5/8/2023")).toBe("2023-08-05");
  });

  it("returns already formatted ISO dates as is", () => {
    expect(toIsoDate("2023-08-15")).toBe("2023-08-15");
  });

  it("handles empty or falsy inputs gracefully", () => {
    expect(toIsoDate("")).toBe("");
  });
});
