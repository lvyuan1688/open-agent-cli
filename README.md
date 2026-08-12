# open-agent-cli

> Open-source coding-agent CLI for cloud and local model providers.
> Inspired by [OpenClaude](https://github.com/Gitlawb/openclaude) (30k+ stars), rewritten from scratch with a stronger gRPC headless layer and lighter CLI core.

## Why

OpenClaude is a 30k-star TypeScript coding-agent CLI, but:
- gRPC layer is basic (no server-streaming / client-streaming modes)
- VS Code extension is bundled but heavy — CLI users pay the weight

**open-agent-cli** ships a stronger gRPC headless layer (3 streaming modes) + a lighter CLI core (VS Code extension as opt-in plugin, not bundled).

## Architecture

```
open-agent-cli/
  src/
    provider/           # ProviderProfile + guided setup
      profile.ts        # saved user-level provider profile
      guide.ts          # /provider guided setup
    tools/              # 8 tool categories
      bash.ts
      file.ts           # read/write/edit
      grep.ts
      glob.ts
      agents.ts         # subagent delegation
      tasks.ts
      mcp.ts            # Model Context Protocol client
      web.ts            # URL fetch/search
    slash/              # custom slash commands
      registry.ts
      builtin.ts        # /help /model /provider /clear
    grpc/               # headless gRPC server (3 streaming modes)
      server.ts
      streaming.ts      # server-streaming + client-streaming + bidi
      proto/            # .proto definitions
    cli.ts              # CLI entry (lighter than OpenClaude)
  vscode-ext/           # opt-in VS Code extension (not bundled)
  docs/
```

### Core interface

```typescript
export interface ProviderProfile {
  name: string;           // "my-openai"
  provider: string;       // "openai" | "anthropic" | "gemini" | "ollama" | "codex"
  apiKey: string;         // from env or keychain
  model: string;          // "gpt-5-coder"
  baseUrl?: string;       // custom endpoint
  isDefault?: boolean;
}

export interface Tool {
  name: string;
  description: string;
  schema: JSONSchema;     // input schema
  execute(input: unknown): Promise<ToolResult>;
}
```

### gRPC streaming modes

```protobuf
service AgentService {
  // Unary: one-shot task
  rpc RunTask(TaskRequest) returns (TaskResponse);
  // Server-streaming: LLM token stream
  rpc StreamTask(TaskRequest) returns (stream TokenChunk);
  // Bidi-streaming: interactive session
  rpc InteractiveSession(stream UserMessage) returns (stream AgentMessage);
  // Client-streaming: batch tasks
  rpc BatchTasks(stream TaskRequest) returns (BatchResponse);
}
```

## Install

```bash
npm install -g open-agent-cli
# or
bun install -g open-agent-cli
```

## Quick start

```bash
# Guided provider setup
open-agent-cli /provider

# Interactive CLI
open-agent-cli

# Headless gRPC server
open-agent-cli serve --port 50051
```

## Provider profiles

```bash
# Add a provider profile (guided)
open-agent-cli /provider add

# List saved profiles
open-agent-cli /provider list

# Switch default
open-agent-cli /provider default my-anthropic
```

Profiles persist at `~/.open-agent-cli/profiles.json`. API keys are read from env vars (`OPENAI_API_KEY`, etc.) — never stored in plaintext.

## gRPC headless mode

Start the gRPC server:

```bash
open-agent-cli serve --port 50051
```

Connect from any gRPC client (CI/CD, custom UI, other agents):

```python
import grpc
stub = agent_pb2_grpc.AgentServiceStub(grpc.insecure_channel("localhost:50051"))
for chunk in stub.StreamTask(agent_pb2.TaskRequest(prompt="refactor auth")):
    print(chunk.token, end="", flush=True)
```

## Custom slash commands

Define your own slash commands in `~/.open-agent-cli/commands/`:

```yaml
# ~/.open-agent-cli/commands/refactor.yml
name: /refactor
description: "Refactor the current file for readability"
prompt: |
  Analyze {{file}} for readability issues.
  Suggest 3 concrete refactors with before/after snippets.
```

## Roadmap

- [x] Provider profiles + guided setup
- [x] 8 tool categories (bash/file/grep/glob/agents/tasks/mcp/web)
- [x] Custom slash commands
- [x] gRPC headless server (4 RPC modes)
- [ ] Opt-in VS Code extension (plugin, not bundled)
- [ ] MCP server mode (expose agent as MCP server)

## License

MIT — see [LICENSE](LICENSE).

## Acknowledgments

- [OpenClaude](https://github.com/Gitlawb/openclaude) — original 30k-star TypeScript coding-agent CLI that inspired this rewrite
- [gRPC](https://grpc.io/) — high-performance RPC framework
