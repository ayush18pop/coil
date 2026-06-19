import dotenv from "dotenv";
import type { Message } from "../types/message";
import type { ToolCall } from "../types/tool";
dotenv.config();

const llmBaseUrl = process.env.LLM_BASE_URL || "http://localhost:11434";
const llmApiKey = process.env.LLM_API_KEY || "ollama";
const llmModel = process.env.LLM_MODEL || "qwen2.5:7b";

export async function callLLM(
  messageHistory: Message[],
  tools?: object[],
): Promise<{ content: string | null; tool_calls?: ToolCall[] }> {
  const response = await fetch(`${llmBaseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${llmApiKey}`,
    },
    body: JSON.stringify({
      model: llmModel,
      messages: messageHistory,
      tools,
      stream: true,
    }),
  });
  if (!response.ok) {
    throw new Error(`LLM error: ${response.status} ${await response.text()}`);
  }

  let content = "";
  const tool_calls: ToolCall[] = [];
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value).split("\n").filter(l => l.startsWith("data: "));
    for (const line of lines) {
      const data = line.slice(6);
      if (data === "[DONE]") continue;
      try {
        const delta = JSON.parse(data).choices[0]?.delta;
        if (delta?.content) {
          process.stdout.write(delta.content);
          content += delta.content;
        }
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (!tool_calls[tc.index]) {
              tool_calls[tc.index] = { id: tc.id ?? "", type: "function", function: { name: tc.function?.name ?? "", arguments: "" } };
            }
            if (tc.function?.arguments) {
              tool_calls[tc.index]!.function.arguments += tc.function.arguments;
            }
          }
        }
      } catch {}
    }
  }

  if (content) process.stdout.write("\n");
  return { content: content || null, tool_calls: tool_calls.length ? tool_calls : undefined };
}
