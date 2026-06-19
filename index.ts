import * as readline from "node:readline";
import { runLoop } from "./src/agent/agent-loop";
import { systemPrompt } from "./src/agent/system-prompt";
import type { Message } from "./src/types/message";

const history: Message[] = [{ role: "system", content: systemPrompt }];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function prompt() {
  rl.question("you: ", async (input) => {
    if (input.trim() === "exit") { rl.close(); return; }

    await runLoop(history, input);

    const last = history.at(-1);
    if (last?.role === "assistant") console.log("agent:", last.content);

    prompt();
  });
}

prompt();
