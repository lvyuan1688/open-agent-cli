# Session Management

## N parallel sessions

One process runs N isolated agent sessions:

```bash
# Start headless server with 20 session slots
open-agent-cli serve --max-sessions 20
```

Each session has:
- Isolated conversation state
- Independent tool registry
- Separate LLM provider config
- Own verify chain

## Session lifecycle

```
Created → Idle → Thinking → Acting → Verifying → Done → (resume or close)
```

## Resume

Sessions persist to `~/.open-agent-cli/sessions/` — resume any past session:

```bash
open-agent-cli resume session_abc123
```

## vs OpenClaude

OpenClaude = 1 session per process. open-agent-cli = N sessions per process — run 20 parallel CI agents on one runner.
