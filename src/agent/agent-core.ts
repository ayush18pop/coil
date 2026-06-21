import type { Message } from "../types/message";
import { runLoop } from "./agent-loop";
import { systemPrompt } from "./system-prompt";

export class Agent {
  private messages: Message[];

  constructor() {
    this.messages = [{ role: "system", content: systemPrompt }];
  }

  async send(userMessage: string): Promise<string> {
    await runLoop(this.messages, userMessage);
    const last = this.messages.at(-1);
    return last?.role === "assistant" ? (last.content ?? "") : "";
  }

  getHistory(): Message[] {
    return this.messages;
  }
}
