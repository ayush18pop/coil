import type { Message } from "../types/message";

export class Agent {
  private messages: Message[];

  constructor() {
    this.messages = [];

    console.log("Agent initialized");
  }
}
