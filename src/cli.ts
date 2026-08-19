#!/usr/bin/env node
// open-agent-cli — CLI entry point.
// Wires the provider registry, MCP client, and gRPC server into a minimal
// `complete` command. Run with `npm run dev -- complete 'hello'`.

import { Command } from "commander";
import { CompletionRequest, LlmProvider, ProviderError } from "./provider.js";
import { McpClient } from "./mcp.js";

// ---- Stub provider for offline examples -----------------------------------
class StubProvider implements LlmProvider {
  readonly name = "ollama" as const;
  async complete(req: CompletionRequest) {
    return {
      text: `[open-agent-cli stub] model=${req.model}`,
      finish_reason: "stop",
    };
  }
  supportsTools() { return false; }
  supportsStreaming() { return false; }
}

const stub = new StubProvider();

// ---- CLI ------------------------------------------------------------------
const program = new Command();

program
  .name("open-agent-cli")
  .description("Open-source coding-agent CLI")
  .version("0.1.0");

program
  .command("complete")
  .description("Send a single completion request")
  .argument("<prompt>", "the user prompt")
  .option("-m, --model <model>", "model name", "gpt-4o-mini")
  .option("-p, --provider <name>", "provider name", "stub")
  .action(async (prompt: string, opts: { model: string; provider: string }) => {
    try {
      const r = await stub.complete({
        model: opts.model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 256,
      });
      console.log(r.text);
    } catch (e) {
      console.error(e instanceof ProviderError ? e.message : String(e));
      process.exit(1);
    }
  });

program
  .command("mcp-list")
  .description("List tools exposed by an MCP server")
  .argument("<command>", "MCP server command, e.g. npx")
  .argument("[args...]", "args to pass to the MCP server")
  .action(async (command: string, args: string[]) => {
    const c = new McpClient(command, args);
    try {
      await c.connect();
      const tools = await c.listTools();
      for (const t of tools) console.log(`- ${t.name}${t.description ? ": " + t.description : ""}`);
    } finally {
      await c.disconnect();
    }
  });

program.parseAsync().catch((e) => {
  console.error(e);
  process.exit(1);
});
