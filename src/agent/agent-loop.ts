import type { Message } from "../types/message";
import { callLLM } from "../llm/llm";
import "../tools/index";
import { getSchemas, executeTool } from "../tools/registry";

export async function runLoop(
  history: Message[],
  userMessage: string,
): Promise<Message[]> {
  history.push({ role: "user", content: userMessage });

  let hasPendingToolCalls = true;

  while (hasPendingToolCalls) {
    const response = await callLLM(history, getSchemas());
    history.push({ role: "assistant", content: response.content, tool_calls: response.tool_calls });
    hasPendingToolCalls = !!response.tool_calls?.length;
    for (const tc of response.tool_calls || []) {
      console.log("tool:", tc.function.name, JSON.parse(tc.function.arguments));
      const args = JSON.parse(tc.function.arguments);
      const result = await executeTool(tc.function.name, args);
      history.push({ role: "tool", content: result, tool_call_id: tc.id });
    }
  }

  return history;
}
