import { describe, expect, it } from "vitest";
import {
  HttpError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from "./errors";

describe("HttpError classes", () => {
  describe("HttpError", () => {
    it("should instantiate with correct properties", () => {
      const error = new HttpError(418, "I'm a teapot");
      expect(error.statusCode).toBe(418);
      expect(error.message).toBe("I'm a teapot");
      expect(error.name).toBe("HttpError");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(HttpError);
    });
  });

  describe("BadRequestError", () => {
    it("should create an HttpError with status 400", () => {
      const error = BadRequestError("Invalid input");
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Invalid input");
      expect(error.name).toBe("HttpError");
    });
  });

  describe("UnauthorizedError", () => {
    it("should create an HttpError with status 401", () => {
      const error = UnauthorizedError("Missing token");
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Missing token");
      expect(error.name).toBe("HttpError");
    });
  });

  describe("ForbiddenError", () => {
    it("should create an HttpError with status 403", () => {
      const error = ForbiddenError("Access denied");
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe("Access denied");
      expect(error.name).toBe("HttpError");
    });
  });

  describe("NotFoundError", () => {
    it("should create an HttpError with status 404", () => {
      const error = NotFoundError("User not found");
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("User not found");
      expect(error.name).toBe("HttpError");
    });
  });
});
