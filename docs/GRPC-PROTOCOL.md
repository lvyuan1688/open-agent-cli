# gRPC Protocol

## Service: AgentService

### rpc RunStream (AgentRequest) returns (stream AgentEvent)

Bidirectional streaming. Client sends prompts, server streams tool calls + state.

### Message: AgentEvent

```protobuf
message AgentEvent {
  oneof event {
    ThinkingEvent thinking = 1;
    ToolCallEvent tool_call = 2;
    VerifyEvent verify = 3;
    DoneEvent done = 4;
  }
}
```

### Session isolation

Each gRPC stream = one isolated agent session. N parallel sessions supported.
