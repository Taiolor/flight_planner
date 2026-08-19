import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Admin mobile responsiveness", () => {
  const notificationsSource = readFileSync(
    resolve(process.cwd(), "client/src/pages/AdminNotifications.tsx"),
    "utf8"
  );
  const telemetrySource = readFileSync(
    resolve(process.cwd(), "client/src/pages/UsageTelemetryMap.tsx"),
    "utf8"
  );
  const headerSource = readFileSync(
    resolve(process.cwd(), "client/src/components/StandardPageHeader.tsx"),
    "utf8"
  );

  it("stacks administrative forms and history rows on mobile", () => {
    expect(notificationsSource).toContain("flex flex-col gap-2 sm:flex-row");
    expect(notificationsSource).toContain("flex flex-wrap items-start gap-x-3 gap-y-1");
    expect(notificationsSource).toContain("w-full bg-purple-600");
  });

  it("keeps header actions and telemetry filters usable in narrow viewports", () => {
    expect(headerSource).toContain("flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto");
    expect(telemetrySource).toContain("grid grid-cols-3 gap-2 sm:flex");
    expect(telemetrySource).toContain("h-[360px] sm:h-[540px]");
  });
});
