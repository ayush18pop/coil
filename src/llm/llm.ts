import dotenv from "dotenv";
import type { Message } from "../types/message";
import type { ToolCall } from "../types/tool";
dotenv.config();

const llmBaseUrl = process.env.LLM_BASE_URL || "http://localhost:11434";
const llmApiKey = process.env.LLM_API_KEY || "ollama";
const llmModel = process.env.LLM_MODEL || "qwen2.5:7b";
const maxRetries = Number(process.env.LLM_MAX_RETRIES) || 3;

class NonRetryableError extends Error {}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      const body = await res.text();
      // 4xx (except 429) are client errors, retrying won't help
      if (res.status < 500 && res.status !== 429) {
        throw new NonRetryableError(`LLM error ${res.status}: ${body}`);
      }
      lastErr = new Error(`LLM error ${res.status}: ${body}`);
    } catch (e) {
      if (e instanceof NonRetryableError) throw e;
      lastErr = e; // network failure or retryable HTTP error
    }
    if (attempt < maxRetries) {
      const delay = 500 * 2 ** attempt; // 500ms, 1s, 2s
      process.stderr.write(
        `\n[llm retry ${attempt + 1}/${maxRetries} in ${delay}ms]\n`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

export async function callLLM(
  messageHistory: Message[],
  tools?: object[],
  onToken?: (chunk: string) => void,
): Promise<{ content: string | null; tool_calls?: ToolCall[] }> {
  const response = await fetchWithRetry(`${llmBaseUrl}/v1/chat/completions`, {
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

  let content = "";
  const tool_calls: ToolCall[] = [];
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value).split("\n").filter((l) => l.startsWith("data: "));
    for (const line of lines) {
      const data = line.slice(6);
      if (data === "[DONE]") continue;
      try {
        const delta = JSON.parse(data).choices[0]?.delta;
        if (delta?.content) {
          content += delta.content;
          // stream to a consumer if given (TUI), otherwise to stdout (REPL)
          if (onToken) onToken(delta.content);
          else process.stdout.write(delta.content);
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

  if (content && !onToken) process.stdout.write("\n");
  return { content: content || null, tool_calls: tool_calls.length ? tool_calls : undefined };
}
