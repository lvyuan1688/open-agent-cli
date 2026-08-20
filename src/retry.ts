// open-agent-cli — retry with exponential backoff.
// Wraps any async operation in a retry loop with jittered backoff.
// Distinguishes retryable errors (network, 5xx, 429) from fatal ones
// (4xx auth, schema validation).

import { setTimeout as sleep } from "node:timers/promises";

/** Options for retry(). */
export interface RetryOptions {
  /** Max attempts including the first. Default 3. */
  maxAttempts?: number;
  /** Initial backoff in ms. Default 200. */
  initialMs?: number;
  /** Backoff multiplier per attempt. Default 2. */
  multiplier?: number;
  /** Max backoff cap per attempt. Default 5_000. */
  maxMs?: number;
  /** Optional jitter factor 0..1 (0=no jitter). Default 0.25. */
  jitter?: number;
  /** Predicate to decide if an error is retryable. Default: always true. */
  isRetryable?: (err: unknown, attempt: number) => boolean;
  /** Optional callback invoked before each retry. */
  onRetry?: (err: unknown, attempt: number, delayMs: number) => void;
}

/** Default retryable predicate: network errors + HTTP 5xx/429. */
export function defaultRetryable(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.status === 429 || (err.status >= 500 && err.status < 600);
  }
  // Anything with a `.code` like ECONNRESET, ETIMEDOUT, ENOTFOUND
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code: string }).code;
    if (typeof code === "string" && code.startsWith("E")) return true;
  }
  return false;
}

/** An HTTP error with a status code, for defaultRetryable. */
export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/** Compute the next backoff delay in ms. */
export function nextDelayMs(
  attempt: number,
  initialMs: number,
  multiplier: number,
  maxMs: number,
  jitter: number,
): number {
  const base = Math.min(initialMs * Math.pow(multiplier, attempt), maxMs);
  if (jitter <= 0) return base;
  // Full jitter: random between 0 and base.
  const j = Math.random() * jitter * base;
  return Math.min(base + j, maxMs);
}

/**
 * Run `op` with retry. `op` must be idempotent or safely re-runnable.
 * Throws the last error if all attempts fail or a fatal error occurs.
 */
export async function retry<T>(
  op: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const initialMs = opts.initialMs ?? 200;
  const multiplier = opts.multiplier ?? 2;
  const maxMs = opts.maxMs ?? 5_000;
  const jitter = opts.jitter ?? 0.25;
  const isRetryable = opts.isRetryable ?? defaultRetryable;

  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await op();
    } catch (err) {
      lastErr = err;
      if (attempt + 1 >= maxAttempts) break;
      if (!isRetryable(err, attempt)) throw err;
      const delayMs = nextDelayMs(
        attempt, initialMs, multiplier, maxMs, jitter,
      );
      opts.onRetry?.(err, attempt + 1, delayMs);
      await sleep(delayMs);
    }
  }
  throw lastErr;
}
