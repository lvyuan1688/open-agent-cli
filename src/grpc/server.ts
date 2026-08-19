// open-agent-cli — gRPC server skeleton.
// Exposes a single `Complete` RPC that proxies to a configured LlmProvider.
// Run with `npm run serve`.

import { createServer, ServerCredentials } from "@grpc/grpc-js";
import { ProviderError } from "./provider.js";

// A minimal proto-loader-free shape. In a real impl, load the .proto file.
interface CompleteRequest {
  model: string;
  prompt: string;
  max_tokens?: number;
}
interface CompleteResponse {
  text: string;
  finish_reason?: string;
}

export function buildServer(complete: (req: CompleteRequest) => Promise<CompleteResponse>) {
  const server = createServer();
  server.addService("openagent.AgentService" as const, {
    Complete: async (call: { request: CompleteRequest }, callback: (e: Error | null, r?: CompleteResponse) => void) => {
      try {
        const r = await complete(call.request);
        callback(null, r);
      } catch (e) {
        callback(e instanceof Error ? e : new ProviderError(e));
      }
    },
  });
  return server;
}

export async function serve(port = 50051): Promise<void> {
  const server = buildServer(async (req) => ({
    text: `[open-agent-cli stub] model=${req.model} prompt=${req.prompt}`,
    finish_reason: "stop",
  }));
  server.bindAsync(`0.0.0.0:${port}`, ServerCredentials.createInsecure(), (err) => {
    if (err) throw err;
    console.log(`open-agent-cli gRPC listening on :${port}`);
  });
}
