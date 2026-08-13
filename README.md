# open-agent-cli

> Open-source coding-agent CLI with gRPC headless mode.
> Inspired by [OpenClaude](https://github.com/opencode-ai/opencode) (30k+ stars), rewritten from scratch in Rust with a first-class gRPC headless mode for CI/IDE integration.

## Why

Most coding-agent CLIs are TUI-first and treat headless/automation as an afterthought. `open-agent-cli` flips that: the gRPC headless server is the core, and the TUI is just one client.

## Features

- gRPC headless server (streaming tool calls + agent state)
- TUI client (attach to a running headless session)
- Bring-your-own LLM (OpenAI-compatible)
- Built-in tools: edit_file, read_file, run_command, code-graph search
- Session resume / multi-session

## Install

```bash
cargo install open-agent-cli
```

## Quick start

```bash
# headless server (default :50051)
open-agent-cli serve

# TUI client attaches to the headless server
open-agent-cli tui
```

## License

MIT
