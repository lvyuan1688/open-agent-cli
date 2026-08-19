// open-agent-cli — MCP (Model Context Protocol) client skeleton.
// The client connects to a stdio MCP server, lists its tools, and exposes a
// `callTool` helper. Transport is JSON-RPC 2.0 over stdin/stdout.

import { spawn, ChildProcessWithoutNullStreams } from "node:child_process";

export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: unknown;
}

export class McpClient {
  private proc: ChildProcessWithoutNullStreams | null = null;
  private seq = 0;
  private pending = new Map<number, (v: unknown) => void>();

  constructor(private readonly command: string, private readonly args: string[] = []) {}

  async connect(): Promise<void> {
    this.proc = spawn(this.command, this.args, { stdio: ["pipe", "pipe", "inherit"] });
    this.proc.on("error", (e) => { throw new ProviderError(e); });
    let buf = "";
    this.proc.stdout.on("data", (chunk: Buffer) => {
      buf += chunk.toString("utf8");
      let nl: number;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        if (!line) continue;
        try {
          const msg = JSON.parse(line);
          if (typeof msg.id === "number" && this.pending.has(msg.id)) {
            this.pending.get(msg.id)!(msg.result);
            this.pending.delete(msg.id);
          }
        } catch { /* ignore non-JSON */ }
      }
    });
  }

  async listTools(): Promise<McpTool[]> {
    const r = await this.rpc("tools/list", {});
    return (r as { tools?: McpTool[] }).tools ?? [];
  }

  async callTool(name: string, args: unknown): Promise<unknown> {
    return this.rpc("tools/call", { name, arguments: args });
  }

  async disconnect(): Promise<void> {
    this.proc?.stdin.end();
    this.proc?.kill("SIGTERM");
    this.proc = null;
  }

  private rpc(method: string, params: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.proc) return reject(new Error("not connected"));
      const id = ++this.seq;
      this.pending.set(id, resolve);
      this.proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    });
  }
}
