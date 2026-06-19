import * as readline from "node:readline";
import { pipeline } from "./src/agent/pipeline";
import { systemPrompt } from "./src/agent/system-prompt";
import type { Message } from "./src/types/message";

const history: Message[] = [{ role: "system", content: systemPrompt }];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function prompt() {
  rl.question("you: ", async (input) => {
    if (input.trim() === "exit") { rl.close(); return; }
    await pipeline(history, input);
    prompt();
  });
}

prompt();
