import { runLoop } from "./src/agent/agent-loop";

await runLoop(
  {
    systemMessage: { role: "system", content: "You are a helpful assistant." },
    userMessages: [],
  },
  {
    role: "user",
    content: "Say hello in one sentence",
  },
);
