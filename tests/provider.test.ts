// open-agent-cli — unit tests (bun test).
// Validates the stub provider and the ProviderError wrapper.

import { test, expect } from "bun:test";
import { CompletionRequest, LlmProvider, ProviderError } from "../src/provider.js";

class StubProvider implements LlmProvider {
  readonly name = "ollama" as const;
  async complete(req: CompletionRequest) {
    return { text: `stub:${req.model}`, finish_reason: "stop" as const };
  }
  supportsTools() { return false; }
  supportsStreaming() { return false; }
}

test("stub provider returns model name", async () => {
  const p = new StubProvider();
  const r = await p.complete({ model: "qwen2.5:7b", messages: [] });
  expect(r.text).toBe("stub:qwen2.5:7b");
});

test("ProviderError wraps underlying cause", () => {
  const cause = new Error("boom");
  const e = new ProviderError(cause);
  expect(e).toBeInstanceOf(Error);
  expect(e.message).toContain("boom");
});
