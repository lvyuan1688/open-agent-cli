// retry.test.ts — unit tests for retry + backoff.

import { strict as assert } from "node:assert";
import { test } from "node:test";
import { ApiError, defaultRetryable, nextDelayMs, retry } from "./retry.js";

test("nextDelayMs: base grows by multiplier, capped at maxMs", () => {
  // No jitter so math is exact.
  const d0 = nextDelayMs(0, 100, 2, 10_000, 0);
  const d1 = nextDelayMs(1, 100, 2, 10_000, 0);
  const d2 = nextDelayMs(2, 100, 2, 10_000, 0);
  assert.equal(d0, 100);
  assert.equal(d1, 200);
  assert.equal(d2, 400);
});

test("nextDelayMs: caps at maxMs", () => {
  const d = nextDelayMs(20, 100, 2, 1_000, 0);
  assert.equal(d, 1_000);
});

test("defaultRetryable: 429 is retryable", () => {
  assert.equal(defaultRetryable(new ApiError(429, "rate")), true);
});

test("defaultRetryable: 503 is retryable", () => {
  assert.equal(defaultRetryable(new ApiError(503, "down")), true);
});

test("defaultRetryable: 401 is NOT retryable", () => {
  assert.equal(defaultRetryable(new ApiError(401, "auth")), false);
});

test("defaultRetryable: ECONNRESET is retryable", () => {
  const err = Object.assign(new Error("reset"), { code: "ECONNRESET" });
  assert.equal(defaultRetryable(err), true);
});

test("retry: succeeds on first attempt", async () => {
  let calls = 0;
  const r = await retry(() => { calls++; return Promise.resolve("ok"); });
  assert.equal(r, "ok");
  assert.equal(calls, 1);
});

test("retry: retries then succeeds", async () => {
  let calls = 0;
  const op = () => {
    calls++;
    if (calls < 3) return Promise.reject(new ApiError(503, "down"));
    return Promise.resolve("ok");
  };
  const r = await retry(op, { maxAttempts: 5, initialMs: 1, jitter: 0 });
  assert.equal(r, "ok");
  assert.equal(calls, 3);
});

test("retry: throws if maxAttempts reached", async () => {
  let calls = 0;
  const op = () => {
    calls++;
    return Promise.reject(new ApiError(503, "down"));
  };
  await assert.rejects(
    () => retry(op, { maxAttempts: 2, initialMs: 1, jitter: 0 }),
    (err: unknown) => err instanceof ApiError && err.status === 503,
  );
  assert.equal(calls, 2);
});

test("retry: non-retryable error throws immediately", async () => {
  let calls = 0;
  const op = () => {
    calls++;
    return Promise.reject(new ApiError(401, "auth"));
  };
  await assert.rejects(
    () => retry(op, { maxAttempts: 5, initialMs: 1, jitter: 0 }),
    (err: unknown) => err instanceof ApiError && err.status === 401,
  );
  assert.equal(calls, 1);
});

test("retry: onRetry callback fires before each retry", async () => {
  const delays: number[] = [];
  let calls = 0;
  const op = () => {
    calls++;
    if (calls < 3) return Promise.reject(new ApiError(503, "down"));
    return Promise.resolve("ok");
  };
  await retry(op, {
    maxAttempts: 5, initialMs: 1, jitter: 0,
    onRetry: (_e, _a, d) => delays.push(d),
  });
  assert.equal(delays.length, 2);
});
