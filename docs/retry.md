# Retry (v0.1.5)

> `src/retry.ts` — retry with jittered exponential backoff.

## Why

Every LLM API call eventually hits a transient failure (429 rate limit,
503 service down, ECONNRESET). Without retry, the agent dies on the
first hiccup. Without backoff, retry storms the API.

`retry()` adds jittered exponential backoff with a retryable-error
predicate.

## API

```ts
import { retry, ApiError } from "./retry.js";

const result = await retry(
  () => provider.complete(req),
  {
    maxAttempts: 5,
    initialMs: 200,
    multiplier: 2,
    maxMs: 5_000,
    jitter: 0.25,
    onRetry: (err, attempt, delayMs) =>
      console.warn(`retry ${attempt} after ${delayMs}ms: ${err}`),
  },
);
```

## Retryable predicate

Default: retry on 429, 5xx, and network errors (`ECONNRESET`, `ETIMEDOUT`, etc.). Do NOT retry on 4xx auth/schema errors.

```ts
import { defaultRetryable } from "./retry.js";
defaultRetryable(new ApiError(503, "down"));  // → true
defaultRetryable(new ApiError(401, "auth"));  // → false
```

Override with `isRetryable: (err, attempt) => boolean`.

## Backoff math

`nextDelayMs(attempt, initialMs, multiplier, maxMs, jitter)`:

- base = `min(initialMs * multiplier^attempt, maxMs)`
- full jitter: `base + random(0, jitter * base)`, capped at `maxMs`

Example: `initialMs=200, multiplier=2, maxMs=5_000, jitter=0.25`

| attempt | base | with jitter (example) |
|---------|------|----------------------|
| 0 | 200 | 200–250 |
| 1 | 400 | 400–500 |
| 2 | 800 | 800–1000 |
| 5 | 6400 → capped 5000 | 5000 |

## Edge cases

- `op` succeeds on first try → returns immediately, 1 call
- `isRetryable` returns false → throws immediately, no retries
- All attempts exhausted → throws the last error
- `maxAttempts = 1` → effectively no retry

## What's NOT in v0.1.5

- Circuit breaker (stop retrying if too many recent failures)
- Bulkhead pattern (limit concurrent retries)
- Per-error-type retry budget (e.g. max 3 retries for 429, 5 for 503)
- Retry budget across process lifetime

## Tests

`src/retry.test.ts` — 11 tests covering backoff math, retryable predicate,
first-try success, retry-then-succeed, max-attempts exhaustion,
non-retryable immediate throw, onRetry callback.
