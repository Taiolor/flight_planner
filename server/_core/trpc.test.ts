import { describe, expect, it } from "vitest";
import { sanitizeTrpcErrorShape } from "./trpc";

const shape = {
  message: "Database connection failed at /internal/path",
  data: {
    code: "INTERNAL_SERVER_ERROR",
    stack: "Error: Database connection failed",
  },
};

describe("sanitizeTrpcErrorShape", () => {
  it("masks internal errors and removes stack traces in production", () => {
    expect(
      sanitizeTrpcErrorShape(shape, "INTERNAL_SERVER_ERROR", true)
    ).toEqual({
      message: "Internal server error",
      data: { code: "INTERNAL_SERVER_ERROR" },
    });
  });

  it("keeps diagnostic information outside production", () => {
    expect(
      sanitizeTrpcErrorShape(shape, "INTERNAL_SERVER_ERROR", false)
    ).toEqual(shape);
  });

  it("keeps public error messages while still removing production stacks", () => {
    expect(sanitizeTrpcErrorShape(shape, "BAD_REQUEST", true)).toEqual({
      message: shape.message,
      data: { code: "INTERNAL_SERVER_ERROR" },
    });
  });
});
