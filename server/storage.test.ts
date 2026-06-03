import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("storagePut and storageGet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    global.fetch = vi.fn();
  });

  it("should throw an error if storage credentials are missing", async () => {
    vi.doMock("./_core/env", () => ({
      ENV: { forgeApiUrl: "", forgeApiKey: "" },
    }));

    const { storagePut, storageGet } = await import("./storage");

    await expect(storagePut("test.txt", "data")).rejects.toThrow(
      "Storage proxy credentials missing"
    );
    await expect(storageGet("test.txt")).rejects.toThrow(
      "Storage proxy credentials missing"
    );
  });

  it("should successfully upload a string via storagePut", async () => {
    vi.doMock("./_core/env", () => ({
      ENV: { forgeApiUrl: "https://api.forge.com/", forgeApiKey: "secret-key" },
    }));

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://api.forge.com/v1/storage/test.txt" }),
    });
    global.fetch = mockFetch;

    const { storagePut } = await import("./storage");

    const result = await storagePut(
      "folder/test.txt",
      "hello world",
      "text/plain"
    );

    expect(result).toEqual({
      key: "folder/test.txt",
      url: "https://api.forge.com/v1/storage/test.txt",
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];

    expect(url.toString()).toBe(
      "https://api.forge.com/v1/storage/upload?path=folder%2Ftest.txt"
    );
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ Authorization: "Bearer secret-key" });
    expect(options.body).toBeInstanceOf(FormData);
  });

  it("should successfully upload a Buffer via storagePut", async () => {
    vi.doMock("./_core/env", () => ({
      ENV: { forgeApiUrl: "https://api.forge.com", forgeApiKey: "secret-key" }, // no trailing slash
    }));

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        url: "https://api.forge.com/v1/storage/buffer.bin",
      }),
    });
    global.fetch = mockFetch;

    const { storagePut } = await import("./storage");

    const buffer = Buffer.from("hello world");
    const result = await storagePut("/folder/buffer.bin", buffer); // test leading slash

    expect(result).toEqual({
      key: "folder/buffer.bin",
      url: "https://api.forge.com/v1/storage/buffer.bin",
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0];
    expect(url.toString()).toBe(
      "https://api.forge.com/v1/storage/upload?path=folder%2Fbuffer.bin"
    );
  });

  it("should throw an error if the upload request fails", async () => {
    vi.doMock("./_core/env", () => ({
      ENV: { forgeApiUrl: "https://api.forge.com", forgeApiKey: "secret-key" },
    }));

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () => "Invalid file format",
    });
    global.fetch = mockFetch;

    const { storagePut } = await import("./storage");

    await expect(storagePut("test.txt", "hello")).rejects.toThrow(
      "Storage upload failed (400 Bad Request): Invalid file format"
    );
  });

  it("should successfully retrieve a download URL via storageGet", async () => {
    vi.doMock("./_core/env", () => ({
      ENV: { forgeApiUrl: "https://api.forge.com", forgeApiKey: "secret-key" },
    }));

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        url: "https://api.forge.com/v1/storage/download/test.txt",
      }),
    });
    global.fetch = mockFetch;

    const { storageGet } = await import("./storage");

    const result = await storageGet("test.txt");

    expect(result).toEqual({
      key: "test.txt",
      url: "https://api.forge.com/v1/storage/download/test.txt",
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];

    expect(url.toString()).toBe(
      "https://api.forge.com/v1/storage/downloadUrl?path=test.txt"
    );
    expect(options.method).toBe("GET");
    expect(options.headers).toEqual({ Authorization: "Bearer secret-key" });
  });

  it("should handle when the failed upload request text() rejects", async () => {
    vi.doMock("./_core/env", () => ({
      ENV: { forgeApiUrl: "https://api.forge.com", forgeApiKey: "secret-key" },
    }));

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => Promise.reject(new Error("Stream read error")),
    });
    global.fetch = mockFetch;

    const { storagePut } = await import("./storage");

    await expect(storagePut("test.txt", "hello")).rejects.toThrow(
      "Storage upload failed (500 Internal Server Error): Internal Server Error"
    );
  });
});
