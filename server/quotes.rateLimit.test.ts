import { describe, expect, it } from "vitest";
import { createQuoteRequestLimiter } from "./routers/quotes";

describe("quote request limiter", () => {
  it("blocks a fifth expensive request in the same one-minute window", () => {
    const limit = createQuoteRequestLimiter(4, 60_000);

    for (let index = 0; index < 4; index += 1) {
      limit("taiolor@gmail.com", 1_000);
    }

    expect(() => limit("taiolor@gmail.com", 1_001)).toThrow(
      "Aguarde um minuto antes de solicitar novas cotações."
    );
  });

  it("opens a new quota window after the configured interval", () => {
    const limit = createQuoteRequestLimiter(1, 1_000);
    limit("taiolor@gmail.com", 1_000);

    expect(() => limit("taiolor@gmail.com", 2_000)).not.toThrow();
  });
});
