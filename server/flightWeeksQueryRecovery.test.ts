import { describe, expect, it, vi } from "vitest";
import {
  isFlightWeeksSchemaMismatchError,
  isTransientFlightWeeksReadError,
  retryTransientFlightWeeksRead,
} from "./flightWeeksQueryRecovery";

describe("flightWeeksQueryRecovery", () => {
  it("reconhece erros transitórios do driver inclusive quando encapsulados", () => {
    expect(
      isTransientFlightWeeksReadError({
        message: "Failed query",
        cause: { code: "PROTOCOL_CONNECTION_LOST" },
      })
    ).toBe(true);
    expect(isTransientFlightWeeksReadError({ code: "ER_BAD_FIELD_ERROR" })).toBe(false);
  });

  it("classifica divergências permanentes de schema sem tratá-las como transitórias", () => {
    const error = { code: "ER_BAD_FIELD_ERROR", message: "Unknown column 'year'" };
    expect(isFlightWeeksSchemaMismatchError(error)).toBe(true);
    expect(isTransientFlightWeeksReadError(error)).toBe(false);
  });

  it("repete uma única vez leituras transitórias e devolve os dados recuperados", async () => {
    const read = vi
      .fn()
      .mockRejectedValueOnce({ code: "ETIMEDOUT", message: "Connection timed out" })
      .mockResolvedValueOnce(["semana 26"]);

    const onTransientFailure = vi.fn();

    await expect(
      retryTransientFlightWeeksRead(read, { retryDelayMs: 0, onTransientFailure })
    ).resolves.toEqual(["semana 26"]);
    expect(read).toHaveBeenCalledTimes(2);
    expect(onTransientFailure).toHaveBeenCalledWith(
      expect.objectContaining({ code: "ETIMEDOUT" })
    );
  });

  it("não mascara uma falha permanente de schema", async () => {
    const error = { code: "ER_BAD_FIELD_ERROR", message: "Unknown column" };
    const read = vi.fn().mockRejectedValue(error);

    await expect(retryTransientFlightWeeksRead(read)).rejects.toBe(error);
    expect(read).toHaveBeenCalledTimes(1);
  });
});
