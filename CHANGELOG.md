# Changelog

All notable changes to open-agent-cli are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] — 2026-08-20

### Added
- `src/provider.ts` `LlmProvider` abstraction + `ProviderError`.
- `src/mcp.ts` JSON-RPC MCP client with `listTools` / `callTool`.
- `src/grpc/server.ts` gRPC skeleton exposing a `Complete` RPC.
- `src/cli.ts` `commander`-based CLI with `complete` and `mcp-list` commands.
- `src/index.ts` public entry point re-exporting the provider + MCP modules.
- `tests/provider.test.ts` bun:test unit tests.
- `tsconfig.json` strict NodeNext config.
- `CONTRIBUTING.md`, Issue/PR templates.

## [0.1.1] — 2026-08-13

### Added
- `docs/v0.1.1-patch-notes.md`.

## [0.1.0] — 2026-08-12

Initial public skeleton.
