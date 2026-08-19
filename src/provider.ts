// open-agent-cli — provider abstraction.
// Inspired by OpenClaude's provider layer, but trimmed to the 5 providers
// most users actually wire up.

export type ProviderName =
  | "openai"
  | "anthropic"
  | "gemini"
  | "ollama"
  | "vllm";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
}

export interface CompletionRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface CompletionResponse {
  text: string;
  finish_reason?: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export interface LlmProvider {
  readonly name: ProviderName;
  complete(req: CompletionRequest): Promise<CompletionResponse>;
  supportsTools(): boolean;
  supportsStreaming(): boolean;
}

export class ProviderError extends Error {
  constructor(public readonly cause: unknown) {
    super(`provider error: ${cause instanceof Error ? cause.message : String(cause)}`);
    this.name = "ProviderError";
  }
}
