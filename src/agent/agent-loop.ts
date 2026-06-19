import type { Message } from "../types/message";
import type { InitialContext } from "../types/agent";
import { callLLM } from "../llm/llm";
import { readFile, readFileSchema } from "../tools/file-system/read-file";
import { writeFile, writeFileSchema } from "../tools/file-system/write-file";

export async function runLoop(
  initialContext: InitialContext,
  latestMessage: Message,
) {
  const history: Message[] = [
    initialContext.systemMessage,
    ...initialContext.userMessages,
  ];
  history.push(latestMessage);

  let hasPendingToolCalls = true;

  while (hasPendingToolCalls) {
    const response = await callLLM(history, [readFileSchema, writeFileSchema]);
    console.log("LLM response:", response);
    history.push({ role: "assistant", content: response.content, tool_calls: response.tool_calls });
    hasPendingToolCalls = !!response.tool_calls?.length;
    for (const tc of response.tool_calls || []) {
      console.log("Tool call:", tc);
      let result = "";
      if (tc.function.name === "read_file") {
        const args = JSON.parse(tc.function.arguments);
        result = await readFile(args.path);
      } else if (tc.function.name === "write_file") {
        const args = JSON.parse(tc.function.arguments);
        await writeFile(args.path, args.content);
        result = `Successfully wrote to ${args.path}`;
      }
      history.push({ role: "tool", content: result, tool_call_id: tc.id });
    }
  }
}
