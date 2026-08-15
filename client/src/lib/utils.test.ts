import { describe, it, expect } from "vitest";
import { cn, extractTime, toIsoDate } from "./utils";

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

describe("extractTime utility", () => {
  it("extracts time from ISO datetime string with T", () => {
    expect(extractTime("2023-10-25T14:30:00.000Z")).toBe("14:30");
  });

  it("extracts time from datetime string with space", () => {
    expect(extractTime("25/10/2023 14:30:00")).toBe("14:30");
  });

  it("returns empty string if time part is missing", () => {
    expect(extractTime("2023-10-25T")).toBe("");
  });

  it("handles empty or null inputs", () => {
    expect(extractTime("")).toBe("");
    expect(extractTime(null)).toBe("");
    expect(extractTime(undefined)).toBe("");
  });
});

describe("toIsoDate utility", () => {
  it("converts DD/MM/YYYY to YYYY-MM-DD", () => {
    expect(toIsoDate("25/10/2023")).toBe("2023-10-25");
  });

  it("pads single digit days and months", () => {
    expect(toIsoDate("5/9/2023")).toBe("2023-09-05");
  });

  it("returns original string if already in YYYY-MM-DD format", () => {
    expect(toIsoDate("2023-10-25")).toBe("2023-10-25");
  });

  it("handles empty or null inputs", () => {
    expect(toIsoDate("")).toBe("");
    expect(toIsoDate(null as any)).toBe("");
    expect(toIsoDate(undefined as any)).toBe("");
  });
});
