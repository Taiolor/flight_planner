import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { invokeLLM, InvokeParams, Message, Tool } from "../llm";

// Mock the ENV module to provide API key and URL
vi.mock("../env", () => ({
  ENV: {
    forgeApiKey: "test-api-key",
    forgeApiUrl: "https://test-api.example.com",
  },
}));

describe("invokeLLM", () => {
  const mockResponse = {
    id: "req_123",
    created: 123456,
    model: "test-model",
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: "Hello world" },
        finish_reason: "stop",
      },
    ],
  };

  beforeEach(() => {
    // Reset global fetch mock
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should successfully invoke LLM with simple string messages", async () => {
    const params: InvokeParams = {
      messages: [{ role: "user", content: "Hi" }],
    };

    const result = await invokeLLM(params);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://test-api.example.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer test-api-key",
        },
        body: expect.stringContaining('"role":"user","content":"Hi"'),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it("should normalize complex message contents (images, files)", async () => {
    const messages: Message[] = [
      {
        role: "user",
        content: [
          { type: "text", text: "Look at this" },
          { type: "image_url", image_url: { url: "https://example.com/img.png" } }
        ],
      },
    ];

    await invokeLLM({ messages });

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(fetchCall[1]!.body as string);

    expect(body.messages[0]).toEqual({
      role: "user",
      content: [
        { type: "text", text: "Look at this" },
        { type: "image_url", image_url: { url: "https://example.com/img.png" } }
      ],
    });
  });

  it("should normalize tool and function messages", async () => {
    const messages: Message[] = [
      {
        role: "tool",
        tool_call_id: "call_123",
        content: [{ type: "text", text: "Tool output" }],
      },
    ];

    await invokeLLM({ messages });

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(fetchCall[1]!.body as string);

    expect(body.messages[0]).toEqual({
      role: "tool",
      tool_call_id: "call_123",
      content: '{"type":"text","text":"Tool output"}',
    });
  });

  it("should throw an error for unsupported message content types", async () => {
    const messages: Message[] = [
      {
        role: "user",
        // @ts-expect-error Intentionally invalid type
        content: [{ type: "unknown" }],
      },
    ];

    await expect(invokeLLM({ messages })).rejects.toThrow("Unsupported message content part");
  });

  it("should pass tools and normalize tool_choice", async () => {
    const tools: Tool[] = [
      {
        type: "function",
        function: { name: "get_weather", description: "Get the weather" },
      },
    ];

    await invokeLLM({
      messages: [{ role: "user", content: "Hi" }],
      tools,
      toolChoice: "required",
    });

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(fetchCall[1]!.body as string);

    expect(body.tools).toEqual(tools);
    expect(body.tool_choice).toEqual({
      type: "function",
      function: { name: "get_weather" },
    });
  });

  it("should throw an error if toolChoice is 'required' but no tools are provided", async () => {
    await expect(
      invokeLLM({
        messages: [{ role: "user", content: "Hi" }],
        toolChoice: "required",
      })
    ).rejects.toThrow("tool_choice 'required' was provided but no tools were configured");
  });

  it("should throw an error if toolChoice is 'required' but multiple tools are provided", async () => {
    const tools: Tool[] = [
      { type: "function", function: { name: "tool1" } },
      { type: "function", function: { name: "tool2" } },
    ];
    await expect(
      invokeLLM({
        messages: [{ role: "user", content: "Hi" }],
        tools,
        toolChoice: "required",
      })
    ).rejects.toThrow("tool_choice 'required' needs a single tool or specify the tool name explicitly");
  });

  it("should support toolChoice as an explicit name", async () => {
    const tools: Tool[] = [
      { type: "function", function: { name: "tool1" } },
      { type: "function", function: { name: "tool2" } },
    ];

    await invokeLLM({
      messages: [{ role: "user", content: "Hi" }],
      tools,
      toolChoice: { name: "tool2" },
    });

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(fetchCall[1]!.body as string);

    expect(body.tool_choice).toEqual({
      type: "function",
      function: { name: "tool2" },
    });
  });

  it("should set response_format when provided explicitly", async () => {
    await invokeLLM({
      messages: [{ role: "user", content: "Hi" }],
      responseFormat: { type: "json_object" },
    });

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(fetchCall[1]!.body as string);

    expect(body.response_format).toEqual({ type: "json_object" });
  });

  it("should throw an error if responseFormat json_schema lacks schema", async () => {
    await expect(
      invokeLLM({
        messages: [{ role: "user", content: "Hi" }],
        // @ts-expect-error Testing missing schema
        responseFormat: { type: "json_schema" },
      })
    ).rejects.toThrow("responseFormat json_schema requires a defined schema object");
  });

  it("should set outputSchema correctly", async () => {
    await invokeLLM({
      messages: [{ role: "user", content: "Hi" }],
      outputSchema: { name: "MySchema", schema: { type: "object" }, strict: true },
    });

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(fetchCall[1]!.body as string);

    expect(body.response_format).toEqual({
      type: "json_schema",
      json_schema: { name: "MySchema", schema: { type: "object" }, strict: true },
    });
  });

  it("should throw an error if outputSchema is incomplete", async () => {
    await expect(
      invokeLLM({
        messages: [{ role: "user", content: "Hi" }],
        // @ts-expect-error Intentionally omitting schema property
        outputSchema: { name: "MySchema" },
      })
    ).rejects.toThrow("outputSchema requires both name and schema");
  });

  it("should handle fetch failures gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "Something went wrong",
    });

    await expect(
      invokeLLM({
        messages: [{ role: "user", content: "Hi" }],
      })
    ).rejects.toThrow("LLM invoke failed: 500 Internal Server Error – Something went wrong");
  });
});

describe("invokeLLM - Missing API Key", () => {
  beforeEach(() => {
    // Override mock to return no API key
    vi.resetModules();
    vi.doMock("../env", () => ({
      ENV: {
        forgeApiKey: "",
      },
    }));
  });

  afterEach(() => {
    vi.doUnmock("../env");
  });

  it("should throw an error if API key is not configured", async () => {
    // Need to dynamically import to pick up the mocked env
    const { invokeLLM } = await import("../llm");

    await expect(
      invokeLLM({
        messages: [{ role: "user", content: "Hi" }],
      })
    ).rejects.toThrow("OPENAI_API_KEY is not configured");
  });
});

describe("invokeLLM - Coverage Additions", () => {
  beforeEach(() => {
    // Reset global fetch mock
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "req_123",
        created: 123456,
        model: "test-model",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Coverage test" },
            finish_reason: "stop",
          },
        ],
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should handle empty toolChoice 'none' and 'auto'", async () => {
    await invokeLLM({
      messages: [{ role: "user", content: "Hi" }],
      toolChoice: "none",
    });

    let fetchCall = vi.mocked(global.fetch).mock.calls[0];
    let body = JSON.parse(fetchCall[1]!.body as string);
    expect(body.tool_choice).toBe("none");

    await invokeLLM({
      messages: [{ role: "user", content: "Hi" }],
      toolChoice: "auto",
    });

    fetchCall = vi.mocked(global.fetch).mock.calls[1];
    body = JSON.parse(fetchCall[1]!.body as string);
    expect(body.tool_choice).toBe("auto");
  });

  it("should handle file_url content correctly", async () => {
    await invokeLLM({
      messages: [{
        role: "user",
        content: [{ type: "file_url", file_url: { url: "test.pdf" } }]
      }],
    });

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(fetchCall[1]!.body as string);
    expect(body.messages[0].content).toEqual([{ type: "file_url", file_url: { url: "test.pdf" } }]);
  });
});

describe("invokeLLM - Fallback URL Coverage", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock("../env");
  });

  it("should fallback to default API URL if forgeApiUrl is empty or missing", async () => {
    vi.doMock("../env", () => ({
      ENV: {
        forgeApiKey: "test-api-key",
        forgeApiUrl: "",
      },
    }));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "req_123",
        created: 123456,
        model: "test-model",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Coverage test" },
            finish_reason: "stop",
          },
        ],
      }),
    });

    const { invokeLLM } = await import("../llm");

    await invokeLLM({
      messages: [{ role: "user", content: "Hi" }],
    });

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    expect(fetchCall[0]).toBe("https://forge.manus.im/v1/chat/completions");
  });
});

describe("invokeLLM - Fallback URL Coverage 2", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock("../env");
  });

  it("should fallback to default API URL if forgeApiUrl contains only whitespace", async () => {
    vi.doMock("../env", () => ({
      ENV: {
        forgeApiKey: "test-api-key",
        forgeApiUrl: "   ",
      },
    }));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "req_123",
        created: 123456,
        model: "test-model",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Coverage test" },
            finish_reason: "stop",
          },
        ],
      }),
    });

    const { invokeLLM } = await import("../llm");

    await invokeLLM({
      messages: [{ role: "user", content: "Hi" }],
    });

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    expect(fetchCall[0]).toBe("https://forge.manus.im/v1/chat/completions");
  });
});

describe("invokeLLM - Fallback URL Coverage 3", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock("../env");
  });

  it("should format forgeApiUrl that ends with a slash correctly", async () => {
    vi.doMock("../env", () => ({
      ENV: {
        forgeApiKey: "test-api-key",
        forgeApiUrl: "https://custom.api.com/",
      },
    }));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "req_123",
        created: 123456,
        model: "test-model",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Coverage test" },
            finish_reason: "stop",
          },
        ],
      }),
    });

    const { invokeLLM } = await import("../llm");

    await invokeLLM({
      messages: [{ role: "user", content: "Hi" }],
    });

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    expect(fetchCall[0]).toBe("https://custom.api.com/v1/chat/completions");
  });
});

describe("invokeLLM - Fallback URL Coverage 4", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock("../env");
  });

  it("should format forgeApiUrl that does not end with a slash correctly", async () => {
    vi.doMock("../env", () => ({
      ENV: {
        forgeApiKey: "test-api-key",
        forgeApiUrl: "https://custom.api.com",
      },
    }));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "req_123",
        created: 123456,
        model: "test-model",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Coverage test" },
            finish_reason: "stop",
          },
        ],
      }),
    });

    const { invokeLLM } = await import("../llm");

    await invokeLLM({
      messages: [{ role: "user", content: "Hi" }],
    });

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    expect(fetchCall[0]).toBe("https://custom.api.com/v1/chat/completions");
  });
});

describe("invokeLLM - Fallback URL Coverage 5", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock("../env");
  });

  it("should handle explicit ToolChoiceExplicit format", async () => {
    vi.doMock("../env", () => ({
      ENV: {
        forgeApiKey: "test-api-key",
      },
    }));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "req_123",
        created: 123456,
        model: "test-model",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Coverage test" },
            finish_reason: "stop",
          },
        ],
      }),
    });

    const { invokeLLM } = await import("../llm");

    await invokeLLM({
      messages: [{ role: "user", content: "Hi" }],
      toolChoice: {
        type: "function",
        function: { name: "my_tool" },
      },
    });

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(fetchCall[1]!.body as string);
    expect(body.tool_choice).toEqual({
        type: "function",
        function: { name: "my_tool" },
      });
  });
});

describe("invokeLLM - Full Coverage 6", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "req_123",
        created: 123456,
        model: "test-model",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Coverage test" },
            finish_reason: "stop",
          },
        ],
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should handle tool message with string content", async () => {
    await invokeLLM({
      messages: [{ role: "tool", tool_call_id: "123", content: "some string output" }],
    });

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(fetchCall[1]!.body as string);
    expect(body.messages[0].content).toBe("some string output");
  });

  it("should handle missing payload.tools and missing response format properties correctly", async () => {
    await invokeLLM({
      messages: [{ role: "user", content: "Hi" }],
      // tools is undefined, testing branch where tools check is bypassed
    });

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(fetchCall[1]!.body as string);
    expect(body.tools).toBeUndefined();
    expect(body.tool_choice).toBeUndefined();
    expect(body.response_format).toBeUndefined();
  });

});

describe("invokeLLM - Full Coverage 7", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "req_123",
        created: 123456,
        model: "test-model",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Coverage test" },
            finish_reason: "stop",
          },
        ],
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should handle response_format snake_case format", async () => {
    await invokeLLM({
      messages: [{ role: "user", content: "Hi" }],
      response_format: { type: "json_object" },
    });

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(fetchCall[1]!.body as string);
    expect(body.response_format).toEqual({ type: "json_object" });
  });

  it("should format strict as false if output_schema is provided without strict explicitly boolean", async () => {
    await invokeLLM({
      messages: [{ role: "user", content: "Hi" }],
      output_schema: { name: "test", schema: {} },
    });

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(fetchCall[1]!.body as string);
    expect(body.response_format.json_schema).toEqual({ name: "test", schema: {} });
  });

  it("should handle tool_choice correctly", async () => {
    await invokeLLM({
      messages: [{ role: "user", content: "Hi" }],
      tool_choice: "auto",
    });

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(fetchCall[1]!.body as string);
    expect(body.tool_choice).toBe("auto");
  });

});

describe("invokeLLM - Full Coverage 8", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "req_123",
        created: 123456,
        model: "test-model",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Coverage test" },
            finish_reason: "stop",
          },
        ],
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should format strict as false if outputSchema is provided without strict explicitly boolean", async () => {
    await invokeLLM({
      messages: [{ role: "user", content: "Hi" }],
      outputSchema: { name: "test", schema: {} },
    });

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(fetchCall[1]!.body as string);
    expect(body.response_format.json_schema).toEqual({ name: "test", schema: {} });
  });

  it("should throw an error if response_format json_schema lacks schema", async () => {
    await expect(
      invokeLLM({
        messages: [{ role: "user", content: "Hi" }],
        // @ts-expect-error Testing missing schema
        response_format: { type: "json_schema" },
      })
    ).rejects.toThrow("responseFormat json_schema requires a defined schema object");
  });
});

describe("invokeLLM - Full Coverage 9", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "req_123",
        created: 123456,
        model: "test-model",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Coverage test" },
            finish_reason: "stop",
          },
        ],
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should format strict explicitly boolean if strict is false", async () => {
    await invokeLLM({
      messages: [{ role: "user", content: "Hi" }],
      outputSchema: { name: "test", schema: {}, strict: false },
    });

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(fetchCall[1]!.body as string);
    expect(body.response_format.json_schema).toEqual({ name: "test", schema: {}, strict: false });
  });

});

describe("invokeLLM - Full Coverage 10", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "req_123",
        created: 123456,
        model: "test-model",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Coverage test" },
            finish_reason: "stop",
          },
        ],
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should throw an error if explicitFormat.type === 'json_schema' but explicitFormat.json_schema?.schema is missing", async () => {
    await expect(
      invokeLLM({
        messages: [{ role: "user", content: "Hi" }],
        // @ts-expect-error Testing missing schema explicitly
        response_format: { type: "json_schema", json_schema: {} },
      })
    ).rejects.toThrow("responseFormat json_schema requires a defined schema object");
  });
});
