import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateImage } from "../imageGeneration";
import { storagePut } from "server/storage";
import { ENV } from "../env";

vi.mock("server/storage", () => ({
  storagePut: vi.fn(),
}));

// We can mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("imageGeneration", () => {
  let originalEnv: typeof ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = { ...ENV };
    ENV.forgeApiUrl = "https://api.example.com";
    ENV.forgeApiKey = "test-api-key";
  });

  afterEach(() => {
    Object.assign(ENV, originalEnv);
  });

  describe("generateImage", () => {
    it("should throw an error if BUILT_IN_FORGE_API_URL is missing", async () => {
      ENV.forgeApiUrl = "";

      await expect(generateImage({ prompt: "test" })).rejects.toThrow("BUILT_IN_FORGE_API_URL is not configured");
    });

    it("should throw an error if BUILT_IN_FORGE_API_KEY is missing", async () => {
      ENV.forgeApiKey = "";

      await expect(generateImage({ prompt: "test" })).rejects.toThrow("BUILT_IN_FORGE_API_KEY is not configured");
    });

    it("should throw an error if the image generation request fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: vi.fn().mockResolvedValue("Invalid prompt"),
      });

      await expect(generateImage({ prompt: "test" })).rejects.toThrow(
        "Image generation request failed (400 Bad Request): Invalid prompt"
      );
    });

    it("should throw an error if the image generation request fails and text() fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: vi.fn().mockRejectedValue(new Error("Cannot read body")),
      });

      await expect(generateImage({ prompt: "test" })).rejects.toThrow(
        "Image generation request failed (500 Internal Server Error)"
      );
    });

    it("should successfully generate an image and save it to storage", async () => {
      const mockB64 = Buffer.from("fake-image-data").toString("base64");

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          image: {
            b64Json: mockB64,
            mimeType: "image/png",
          },
        }),
      });

      vi.mocked(storagePut).mockResolvedValueOnce({
        url: "https://storage.example.com/generated-image.png",
        key: "generated/12345.png",
      });

      const response = await generateImage({ prompt: "A beautiful landscape" });

      expect(response).toEqual({
        url: "https://storage.example.com/generated-image.png",
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const fetchArgs = mockFetch.mock.calls[0];
      expect(fetchArgs[0]).toBe("https://api.example.com/images.v1.ImageService/GenerateImage");
      expect(fetchArgs[1].method).toBe("POST");
      expect(fetchArgs[1].headers.authorization).toBe("Bearer test-api-key");
      expect(JSON.parse(fetchArgs[1].body)).toEqual({
        prompt: "A beautiful landscape",
        original_images: [],
      });

      expect(storagePut).toHaveBeenCalledTimes(1);
      const storageArgs = vi.mocked(storagePut).mock.calls[0];
      expect(storageArgs[0]).toMatch(/^generated\/\d+\.png$/);
      expect(storageArgs[1]).toEqual(Buffer.from(mockB64, "base64"));
      expect(storageArgs[2]).toBe("image/png");
    });

    it("should include originalImages in the request payload if provided", async () => {
      const mockB64 = Buffer.from("fake-image-data").toString("base64");

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          image: {
            b64Json: mockB64,
            mimeType: "image/png",
          },
        }),
      });

      vi.mocked(storagePut).mockResolvedValueOnce({
        url: "https://storage.example.com/generated-image2.png",
        key: "generated/12345.png",
      });

      await generateImage({
        prompt: "A beautiful landscape",
        originalImages: [
          { url: "https://example.com/original.jpg", mimeType: "image/jpeg" }
        ]
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const fetchArgs = mockFetch.mock.calls[0];
      expect(JSON.parse(fetchArgs[1].body)).toEqual({
        prompt: "A beautiful landscape",
        original_images: [
          { url: "https://example.com/original.jpg", mimeType: "image/jpeg" }
        ],
      });
    });
  });
});
