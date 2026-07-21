import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { notifyOwner } from "../notification";
import { ENV } from "../env";
import { TRPCError } from "@trpc/server";

describe("notifyOwner", () => {
  const originalFetch = global.fetch;
  let originalEnv: any;
  const originalEnvVars = process.env;

  beforeEach(() => {
    vi.resetModules();
    originalEnv = { ...ENV };
    process.env = { ...originalEnvVars };
    ENV.forgeApiUrl = "https://api.example.com/";
    ENV.forgeApiKey = "test-api-key";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    Object.assign(ENV, originalEnv);
    process.env = originalEnvVars;
    vi.clearAllMocks();
  });

  it("should handle error when getting detail text from a non-ok response", async () => {
    const mockWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: vi.fn().mockRejectedValue(new Error("Cannot read body")),
    } as unknown as Response);

    const result = await notifyOwner({
      title: "Test",
      content: "Test Content",
    });
    expect(result).toBe(false);
    expect(mockWarn).toHaveBeenCalledWith(
      "[Notification] Failed to notify owner (400 Bad Request)"
    );
    mockWarn.mockRestore();
  });

  it("should truncate title if it is exactly max length + 1", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
    } as Response);
    const result = await notifyOwner({
      title: "a".repeat(1201),
      content: "Valid Content",
    });
    expect(result).toBe(true);
    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const fetchOptions = fetchCall[1];
    const fetchBody = JSON.parse(fetchOptions!.body as string);
    expect(fetchBody.title).toHaveLength(1200);
    expect(fetchBody.title.endsWith("...")).toBe(true);
  });

  it("should truncate content if it is exactly max length + 1", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
    } as Response);
    const result = await notifyOwner({
      title: "Valid Title",
      content: "a".repeat(20001),
    });
    expect(result).toBe(true);
    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const fetchOptions = fetchCall[1];
    const fetchBody = JSON.parse(fetchOptions!.body as string);
    expect(fetchBody.content).toHaveLength(20000);
    expect(fetchBody.content.endsWith("...")).toBe(true);
  });

  it("should handle invalid URL inside buildEndpointUrl", async () => {
    ENV.forgeApiUrl = "invalid-url";
    await expect(
      notifyOwner({ title: "Test", content: "Test Content" })
    ).rejects.toThrowError(TypeError);
  });

  it("should throw TRPCError if ENV.forgeApiUrl is not configured", async () => {
    ENV.forgeApiUrl = "";
    await expect(
      notifyOwner({ title: "Test", content: "Test Content" })
    ).rejects.toThrowError(TRPCError);
  });

  it("should handle invalid URL inside buildEndpointUrl", async () => {
    ENV.forgeApiUrl = "invalid-url";
    await expect(
      notifyOwner({ title: "Test", content: "Test Content" })
    ).rejects.toThrowError(TypeError);
  });

  it("should throw TRPCError if ENV.forgeApiKey is not configured", async () => {
    ENV.forgeApiKey = "";
    await expect(
      notifyOwner({ title: "Test", content: "Test Content" })
    ).rejects.toThrowError(TRPCError);
  });

  it("should throw TRPCError if title is missing", async () => {
    await expect(
      notifyOwner({ title: "   ", content: "Valid Content" })
    ).rejects.toThrowError(TRPCError);
  });

  it("should throw TRPCError if content is missing", async () => {
    await expect(
      notifyOwner({ title: "Valid Title", content: "" })
    ).rejects.toThrowError(TRPCError);
  });

  it("should truncate title and content if they exceed max lengths", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
    } as Response);

    const longTitle = "a".repeat(1205);
    const longContent = "b".repeat(20005);

    const result = await notifyOwner({
      title: longTitle,
      content: longContent,
    });

    expect(result).toBe(true);

    // Check that fetch was called with truncated values
    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const fetchOptions = fetchCall[1];
    const fetchBody = JSON.parse(fetchOptions!.body as string);

    expect(fetchBody.title).toHaveLength(1200);
    expect(fetchBody.title.endsWith("...")).toBe(true);

    expect(fetchBody.content).toHaveLength(20000);
    expect(fetchBody.content.endsWith("...")).toBe(true);
  });

  it("should return true when fetch is successful", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
    } as Response);

    const result = await notifyOwner({
      title: "Test",
      content: "Test Content",
    });
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("should return false when fetch is unsuccessful (response.ok is false)", async () => {
    const mockWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: vi.fn().mockResolvedValue("Some error details"),
    } as unknown as Response);

    const result = await notifyOwner({
      title: "Test",
      content: "Test Content",
    });
    expect(result).toBe(false);
    expect(mockWarn).toHaveBeenCalledWith(
      "[Notification] Failed to notify owner (400 Bad Request): Some error details"
    );
    mockWarn.mockRestore();
  });

  it("should catch fetch errors and return false", async () => {
    const mockWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchError = new Error("Network Error");
    global.fetch = vi.fn().mockRejectedValue(fetchError);

    const result = await notifyOwner({
      title: "Test",
      content: "Test Content",
    });
    expect(result).toBe(false);
    expect(mockWarn).toHaveBeenCalledWith(
      "[Notification] Error calling notification service:",
      fetchError
    );
    mockWarn.mockRestore();
  });

  it("should handle invalid URL inside buildEndpointUrl", async () => {
    ENV.forgeApiUrl = "invalid-url";
    await expect(
      notifyOwner({ title: "Test", content: "Test Content" })
    ).rejects.toThrowError(TypeError);
  });
});
