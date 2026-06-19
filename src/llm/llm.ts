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
    }),
  });
  if (!response.ok) {
    throw new Error(`LLM error: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return data.choices[0].message;
}
