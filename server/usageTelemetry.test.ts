import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  values: vi.fn(),
  insert: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock("./db", () => ({
  getDb: mocks.getDb,
}));

import { recordUsageTelemetryEvents } from "./usageTelemetry";

describe("persistência de telemetria de uso", () => {
  beforeEach(() => {
    mocks.values.mockReset();
    mocks.insert.mockReset();
    mocks.getDb.mockReset();
    mocks.insert.mockReturnValue({ values: mocks.values });
    mocks.getDb.mockResolvedValue({ insert: mocks.insert });
  });

  it("pseudonimiza o nonce efêmero antes de persistir um evento", async () => {
    const sessionId = "b8d3ca80b31544f4a8ac4dd2fdd4c803";
    await recordUsageTelemetryEvents(sessionId, [
      {
        eventType: "query",
        route: "/calendar",
        procedure: "flights.getWeeks",
        latitudeE2: -2355,
        longitudeE2: -4663,
      },
    ]);

    expect(mocks.values).toHaveBeenCalledWith([
      expect.objectContaining({
        eventType: "query",
        route: "/calendar",
        sessionHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    ]);
    const inserted = mocks.values.mock.calls[0][0][0];
    expect(inserted.sessionHash).not.toBe(sessionId);
  });
});
