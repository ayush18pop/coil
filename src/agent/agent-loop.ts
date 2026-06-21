import type { Message } from "../types/message";
import { callLLM } from "../llm/llm";
import "../tools/index";
import { getSchemas, executeTool } from "../tools/registry";

export type LoopEvents = {
  onToken?: (chunk: string) => void;
  onTool?: (name: string, args: unknown) => void;
};

export async function runLoop(
  history: Message[],
  userMessage: string,
  events?: LoopEvents,
): Promise<Message[]> {
  history.push({ role: "user", content: userMessage });

  let hasPendingToolCalls = true;

  while (hasPendingToolCalls) {
    const response = await callLLM(history, getSchemas(), events?.onToken);
    history.push({ role: "assistant", content: response.content, tool_calls: response.tool_calls });
    hasPendingToolCalls = !!response.tool_calls?.length;

    for (const tc of response.tool_calls || []) {
      let result: string;
      try {
        const args = JSON.parse(tc.function.arguments);
        if (events?.onTool) events.onTool(tc.function.name, args);
        else console.log("tool:", tc.function.name, args);
        result = await executeTool(tc.function.name, args);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!events?.onTool) console.log("tool error:", tc.function.name, msg);
        result = `Error running ${tc.function.name}: ${msg}. Check your arguments and try again.`;
      }
      history.push({ role: "tool", content: result, tool_call_id: tc.id });
    }
  }

  return history;
}
