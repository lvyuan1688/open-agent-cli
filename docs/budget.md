# Token budget (v0.1.4)

> `src/budget.ts` — track token usage across a session and hard-stop
> when a configurable budget is exceeded.

## Why

Long-running agent sessions can spend $20+ of tokens before anyone
notices. `TokenBudget` is a tiny accountant:

- `record(resp)` — adds `resp.usage` to the running totals
- `check()` — throws `BudgetExceeded` if `total_tokens >= budget`
- `snapshot()` — returns `{prompt_tokens, completion_tokens, total_tokens, calls}`

## Usage

```ts
import { TokenBudget, consume } from "./budget.js";

const budget = new TokenBudget(50_000);  // hard cap

for (const resp of completions) {
  consume(budget, resp);                  // record + check
}
console.log(budget.snapshot());           // final tally
```

## Edge cases

- `budget = 0` (default) → **no limit**, `check()` is a no-op
- `budget < 0` → treated as "no limit" (same as 0)
- `resp.usage` missing → `record` is a no-op (provider didn't return usage)
- `total_tokens >= budget` at the start → first `check()` throws

## Integration with the CLI

```ts
// src/cli.ts — `complete` command
const budget = new TokenBudget(opts.budget ?? 0);
const resp = await provider.complete(req);
consume(budget, resp);
console.log(budget.snapshot());
```

## Not in v0.1.4

- Per-model budgets (e.g. $1 on gpt-4o, $5 on o1-preview)
- Soft warnings at 80% / 90% (only hard-stop today)
- Persistence across sessions
