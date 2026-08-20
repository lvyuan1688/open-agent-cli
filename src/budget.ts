// open-agent-cli — token-usage accounting + budget guard.
// Tracks cumulative prompt/completion tokens across a session and
// hard-stops when a configurable budget is exceeded.

import { CompletionResponse, Usage } from "./provider.js";

/** A point-in-time snapshot of accumulated token usage. */
export interface UsageSnapshot {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  calls: number;
}

/** A budget guard. `check` throws when total_tokens >= budget. */
export class TokenBudget {
  private prompt = 0;
  private completion = 0;
  private calls = 0;
  /** Zero or negative means "no limit". */
  constructor(public readonly budget: number = 0) {}

  /** Record one completion response's usage. No-op if `usage` is missing. */
  record(resp: CompletionResponse): void {
    if (!resp.usage) return;
    this.prompt += resp.usage.prompt_tokens;
    this.completion += resp.usage.completion_tokens;
    this.calls += 1;
  }

  /** Throw `BudgetExceeded` if the running total has hit the budget. */
  check(): void {
    if (this.budget > 0 && this.total() >= this.budget) {
      throw new BudgetExceeded(this.budget, this.total());
    }
  }

  snapshot(): UsageSnapshot {
    return {
      prompt_tokens: this.prompt,
      completion_tokens: this.completion,
      total_tokens: this.total(),
      calls: this.calls,
    };
  }

  private total(): number {
    return this.prompt + this.completion;
  }
}

/** Thrown by `TokenBudget.check` when the budget is hit. */
export class BudgetExceeded extends Error {
  constructor(public readonly budget: number, public readonly used: number) {
    super(`token budget exceeded: used ${used} of ${budget}`);
    this.name = "BudgetExceeded";
  }
}

/** Convenience helper: record + check in one call. */
export function consume(budget: TokenBudget, resp: CompletionResponse): void {
  budget.record(resp);
  budget.check();
}
