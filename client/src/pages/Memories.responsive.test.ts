import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Memories mobile responsiveness", () => {
  const source = readFileSync(
    resolve(process.cwd(), "client/src/pages/Memories.tsx"),
    "utf8"
  );

  it("uses a progressive media grid and a full-width upload action on mobile", () => {
    expect(source).toContain("grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3");
    expect(source).toContain("inline-flex w-full cursor-pointer items-center justify-center");
  });

  it("keeps destructive media actions visible on touch screens", () => {
    expect(source).toContain("opacity-100 transition sm:opacity-0");
  });

  it("preserves the correct diary label and exposes the carousel above its background layer", () => {
    expect(source).toContain("Diário de Bordo");
    expect(source).toContain("relative isolate min-h-screen");
  });

  it("animates the yearly route card without forcing motion for reduced-motion users", () => {
    expect(source).toContain("slide-in-from-right-4");
    expect(source).toContain("hover:-translate-y-1");
    expect(source).toContain("motion-reduce:animate-none");
    expect(source).toContain("motion-reduce:hover:transform-none");
  });

  it("shows annual route mileage and exposes route details through an accessible control", () => {
    expect(source).toContain("formatKm(summary?.totalKm ?? 0)");
    expect(source).toContain('aria-controls="year-route-details"');
    expect(source).toContain("routeDetailsOpen");
    expect(source).toContain("group-hover:animate-pulse");
  });

  it("opens the Fly.IA summary on demand and triggers first generation automatically", () => {
    expect(source).toContain("generateSummaryMutation");
    expect(source).toContain("requestedAutomatically.current");
    expect(source).toContain("IntersectionObserver");
    expect(source).toContain("Atualizar resumo");
  });
});
