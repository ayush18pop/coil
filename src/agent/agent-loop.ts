import type { Message } from "../types/message";
import type { InitialContext } from "../types/agent";
import { callLLM } from "../llm/llm";

export async function runLoop(
  initialContext: InitialContext,
  latestMessage: Message,
) {
  const history: Message[] = [
    initialContext.systemMessage,
    ...initialContext.userMessages,
  ];
  while (true) {
    const response = await callLLM(history, latestMessage);
    console.log("LLM response:", response);
    history.push({ role: "assistant", content: response });
    break;
  }
}
