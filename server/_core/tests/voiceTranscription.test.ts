import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { transcribeAudio } from "../voiceTranscription";
import { ENV } from "../env";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("voiceTranscription", () => {
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

  describe("transcribeAudio", () => {
    it("should return SERVICE_ERROR if BUILT_IN_FORGE_API_URL is missing", async () => {
      ENV.forgeApiUrl = "";

      const result = await transcribeAudio({ audioUrl: "http://example.com/audio.mp3" });

      expect(result).toEqual({
        error: "Voice transcription service is not configured",
        code: "SERVICE_ERROR",
        details: "BUILT_IN_FORGE_API_URL is not set",
      });
    });

    it("should return SERVICE_ERROR if BUILT_IN_FORGE_API_KEY is missing", async () => {
      ENV.forgeApiKey = "";

      const result = await transcribeAudio({ audioUrl: "http://example.com/audio.mp3" });

      expect(result).toEqual({
        error: "Voice transcription service authentication is missing",
        code: "SERVICE_ERROR",
        details: "BUILT_IN_FORGE_API_KEY is not set",
      });
    });

    it("should return INVALID_FORMAT if audio download fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      const result = await transcribeAudio({ audioUrl: "http://example.com/audio.mp3" });

      expect(result).toEqual({
        error: "Failed to download audio file",
        code: "INVALID_FORMAT",
        details: "HTTP 404: Not Found",
      });
    });

    it("should return FILE_TOO_LARGE if audio file is over 16MB", async () => {
      // 17MB array buffer
      const largeBuffer = new ArrayBuffer(17 * 1024 * 1024);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "audio/mpeg" }),
        arrayBuffer: vi.fn().mockResolvedValue(largeBuffer),
      });

      const result = await transcribeAudio({ audioUrl: "http://example.com/large-audio.mp3" });

      expect(result).toEqual({
        error: "Audio file exceeds maximum size limit",
        code: "FILE_TOO_LARGE",
        details: "File size is 17.00MB, maximum allowed is 16MB",
      });
    });

    it("should return SERVICE_ERROR if fetching audio file throws an error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network Error"));

      const result = await transcribeAudio({ audioUrl: "http://example.com/audio.mp3" });

      expect(result).toEqual({
        error: "Failed to fetch audio file",
        code: "SERVICE_ERROR",
        details: "Network Error",
      });
    });

    it("should return TRANSCRIPTION_FAILED if transcription service request fails", async () => {
      const normalBuffer = new ArrayBuffer(1024);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "audio/mpeg" }),
        arrayBuffer: vi.fn().mockResolvedValue(normalBuffer),
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: vi.fn().mockResolvedValue("Server Error Details"),
      });

      const result = await transcribeAudio({ audioUrl: "http://example.com/audio.mp3" });

      expect(result).toEqual({
        error: "Transcription service request failed",
        code: "TRANSCRIPTION_FAILED",
        details: "500 Internal Server Error: Server Error Details",
      });
    });

    it("should return SERVICE_ERROR if transcription service returns invalid response", async () => {
      const normalBuffer = new ArrayBuffer(1024);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "audio/mpeg" }),
        arrayBuffer: vi.fn().mockResolvedValue(normalBuffer),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ not_text: "Missing text field" }),
      });

      const result = await transcribeAudio({ audioUrl: "http://example.com/audio.mp3" });

      expect(result).toEqual({
        error: "Invalid transcription response",
        code: "SERVICE_ERROR",
        details: "Transcription service returned an invalid response format",
      });
    });

    it("should successfully transcribe audio with default prompt", async () => {
      const normalBuffer = new ArrayBuffer(1024);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "audio/mpeg" }),
        arrayBuffer: vi.fn().mockResolvedValue(normalBuffer),
      });

      const mockResponse = {
        task: "transcribe",
        language: "en",
        duration: 2.5,
        text: "Hello world",
        segments: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const result = await transcribeAudio({ audioUrl: "http://example.com/audio.mp3" });

      expect(result).toEqual(mockResponse);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      const apiFetchArgs = mockFetch.mock.calls[1];
      expect(apiFetchArgs[0]).toBe("https://api.example.com/v1/audio/transcriptions");
      expect(apiFetchArgs[1].method).toBe("POST");
      expect(apiFetchArgs[1].headers.authorization).toBe("Bearer test-api-key");

      const formData = apiFetchArgs[1].body as FormData;
      expect(formData.get("prompt")).toBe("Transcribe the user's voice to text");
      expect(formData.get("model")).toBe("whisper-1");
      expect(formData.get("response_format")).toBe("verbose_json");
    });

    it("should use language-specific prompt if language is provided", async () => {
      const normalBuffer = new ArrayBuffer(1024);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "audio/mpeg" }),
        arrayBuffer: vi.fn().mockResolvedValue(normalBuffer),
      });

      const mockResponse = {
        task: "transcribe",
        language: "es",
        duration: 2.5,
        text: "Hola mundo",
        segments: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const result = await transcribeAudio({
        audioUrl: "http://example.com/audio.mp3",
        language: "es",
      });

      expect(result).toEqual(mockResponse);

      const apiFetchArgs = mockFetch.mock.calls[1];
      const formData = apiFetchArgs[1].body as FormData;
      expect(formData.get("prompt")).toBe("Transcribe the user's voice to text, the user's working language is Spanish");
    });

    it("should use custom prompt if provided", async () => {
      const normalBuffer = new ArrayBuffer(1024);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "audio/mpeg" }),
        arrayBuffer: vi.fn().mockResolvedValue(normalBuffer),
      });

      const mockResponse = {
        task: "transcribe",
        language: "en",
        duration: 2.5,
        text: "Meeting notes",
        segments: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const result = await transcribeAudio({
        audioUrl: "http://example.com/audio.mp3",
        prompt: "Transcribe the meeting",
      });

      expect(result).toEqual(mockResponse);

      const apiFetchArgs = mockFetch.mock.calls[1];
      const formData = apiFetchArgs[1].body as FormData;
      expect(formData.get("prompt")).toBe("Transcribe the meeting");
    });
  });
});
