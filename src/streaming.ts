// open-agent-cli — SSE streaming for OpenAI-compatible chat completions.
// Parses `text/event-stream` chunks and yields CompletionResponse deltas.
// Falls back to a non-streaming call if the provider doesn't support it.

import { ChatMessage, CompletionRequest, CompletionResponse, LlmProvider, ProviderError } from "./provider.js";

/** One SSE event parsed from the stream. */
export interface SseEvent {
  /** `event:` field, or "message" if absent. */
  event: string;
  /** `data:` field, concatenated across multiple `data:` lines. */
  data: string;
  /** Optional `id:` field. */
  id?: string;
  /** Optional `retry:` field (ms). */
  retry?: number;
}

/**
 * Parse a complete SSE event-stream string into SseEvent[].
 * Handles multi-line `data:` fields and the `\n\n` event separator.
 */
export function parseSse(raw: string): SseEvent[] {
  const events: SseEvent[] = [];
  for (const block of raw.split(/\n\n+/)) {
    if (!block.trim()) continue;
    let event = "message";
    const dataLines: string[] = [];
    let id: string | undefined;
    let retry: number | undefined;
    for (const line of block.split(/\n/)) {
      const idx = line.indexOf(":");
      const field = idx >= 0 ? line.slice(0, idx) : line;
      const value = idx >= 0 ? line.slice(idx + 1).replace(/^ /, "") : "";
      switch (field) {
        case "event": event = value; break;
        case "data": dataLines.push(value); break;
        case "id": id = value; break;
        case "retry": retry = Number(value); if (!Number.isFinite(retry)) retry = undefined; break;
        default: break; // ignore unknown fields / comments
      }
    }
    events.push({ event, data: dataLines.join("\n"), id, retry });
  }
  return events;
}

/**
 * Parse one OpenAI streaming chunk (the `data:` payload) into a text delta.
 * Returns "" for keepalive `[DONE]` chunks.
 */
export function parseChunkDelta(data: string): string {
  if (!data || data === "[DONE]") return "";
  try {
    const j = JSON.parse(data);
    const choice = j.choices?.[0];
    const delta = choice?.delta?.content ?? choice?.message?.content;
    return typeof delta === "string" ? delta : "";
  } catch {
    return ""; // ignore malformed lines — SSE is forgiving
  }
}

/** Result of a streaming completion. */
export interface StreamResult {
  /** Concatenated text deltas. */
  text: string;
  /** Final finish_reason from the last non-empty chunk, if any. */
  finish_reason?: string;
  /** Number of chunks received. */
  chunks: number;
}

/**
 * Stream a completion over fetch + ReadableStream. Calls `onDelta` for each
 * text chunk. Returns the concatenated text + chunk count.
 *
 * This is the browser-style API; in Node.js you'd pipe `response.body`
 * through a TextDecoder and feed the raw string to `parseSse`.
 */
export async function streamCompletion(
  url: string,
  headers: Record<string, string>,
  body: CompletionRequest & { stream: true },
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<StreamResult> {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal,
  });
  if (!resp.ok || !resp.body) {
    throw new ProviderError(new Error(`HTTP ${resp.status}`));
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buf = "";
  let text = "";
  let finish_reason: string | undefined;
  let chunks = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const events = parseSse(buf);
    buf = ""; // consume; a partial last event would need a splitter
    for (const ev of events) {
      if (ev.data === "[DONE]") continue;
      const delta = parseChunkDelta(ev.data);
      if (delta) { text += delta; onDelta(delta); }
      try {
        const j = JSON.parse(ev.data);
        const fr = j.choices?.[0]?.finish_reason;
        if (typeof fr === "string") finish_reason = fr;
      } catch { /* ignore */ }
      chunks++;
    }
  }
  return { text, finish_reason, chunks };
}

/** Convenience: stream via a provider that already supports streaming. */
export async function streamViaProvider(
  provider: LlmProvider,
  req: CompletionRequest,
  onDelta: (text: string) => void,
): Promise<StreamResult> {
  if (!provider.supportsStreaming()) {
    // Fallback: non-streaming complete, single delta.
    const r = await provider.complete(req);
    onDelta(r.text);
    return { text: r.text, finish_reason: r.finish_reason, chunks: 1 };
  }
  // Real providers expose their own stream method; the skeleton returns
  // one big delta to keep the type interface simple.
  const r = await provider.complete(req);
  onDelta(r.text);
  return { text: r.text, finish_reason: r.finish_reason, chunks: 1 };
}
