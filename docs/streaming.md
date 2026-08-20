# Streaming (SSE)

> v0.1.3 — `src/streaming.ts` adds OpenAI-compatible SSE streaming.

## Why

Non-streaming completions force the user to wait for the entire response
before seeing any output. Streaming sends text deltas as they're generated,
which feels dramatically faster for long completions and lets the UI render
progressively.

## The three pieces

```ts
parseSse(raw: string): SseEvent[]          // event-stream → structured events
parseChunkDelta(data: string): string      // one OpenAI chunk → text delta
streamCompletion(url, headers, body, onDelta): Promise<StreamResult>
```

## Wire format

OpenAI streams `text/event-stream` with one event per chunk:

```
data: {"choices":[{"delta":{"content":"Hello"}}]}

data: {"choices":[{"delta":{"content":" world"}}]}

data: {"choices":[{"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

`parseSse` handles the `\n\n` event separator and multi-line `data:` fields.
`parseChunkDelta` extracts `choices[0].delta.content`, returning `""` for
keepalive `[DONE]` chunks.

## Usage in the CLI

```ts
import { streamCompletion } from "./streaming.js";

await streamCompletion(
  "https://api.openai.com/v1/chat/completions",
  { Authorization: `Bearer ${key}` },
  { model: "gpt-4o-mini", messages, stream: true },
  (delta) => process.stdout.write(delta),
);
```

## Fallback

If a provider returns `supportsStreaming() === false`,
`streamViaProvider` falls back to a single non-streaming call and emits one
big delta. The CLI doesn't care which path ran — it just sees `onDelta`
calls.

## Error handling

- HTTP non-2xx → `ProviderError(HTTP <status>)`
- Malformed SSE line → silently ignored (SSE is forgiving)
- AbortSignal → fetch rejects with `AbortError`, caller decides what to do

## Not in v0.1.3

- Tool-call streaming (OpenAI sends tool deltas differently)
- Backpressure / pause-resume
- Reconnect on dropped stream
