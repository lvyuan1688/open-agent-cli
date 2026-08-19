# Contributing to open-agent-cli

Thanks for your interest! This is a community-driven, open-source coding-agent
CLI. Contributions of all sizes are welcome.

## Quick start

```bash
git clone https://github.com/lvyuan1688/open-agent-cli
cd open-agent-cli
npm install
npm run build
npm test
```

You don't need an API key to run the skeleton — the stub provider returns a
hard-coded response so `npm run dev -- complete 'hi'` works offline.

## Ways to contribute

- **Bugs**: open an issue with OS, Node version, command, and stack trace.
- **Features**: open an issue first to scope the work, then send a PR.
- **Providers**: add a new `LlmProvider` in `src/provider.ts`. Wire it into the
  CLI in `src/cli.ts`.
- **MCP**: add or test MCP server integrations in `src/mcp.ts`.
- **gRPC**: extend `src/grpc/server.ts` with new RPCs.

## Pull request checklist

- [ ] `npm run build` succeeds
- [ ] `npm test` passes
- [ ] `tsc --noEmit` is clean
- [ ] `CHANGELOG.md` updated (if user-visible)
- [ ] Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)

## Code of conduct

Be kind. Personal attacks, harassment, or discriminatory behavior will not be
tolerated.

## License

By contributing, you agree your contributions are licensed under the MIT
license (see `LICENSE`).
