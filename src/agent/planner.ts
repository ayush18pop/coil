import { callLLM } from "../llm/llm";
import type { Message } from "../types/message";

const plannerPrompt = `You are a planning assistant for an AI coding agent that works in: ${process.cwd()}

The agent has exactly these tools: read_file, write_file, list_directory, run_command.

Output ONLY a numbered list of plain English steps. Each step must reference one of the four tools above and a specific path or command.

Example of correct output:
1. Use list_directory on "." to see the project structure
2. Use read_file on "package.json" to understand dependencies
3. Use write_file on "README.md" with the summary

Do NOT write code. Do NOT use any other tools. Do NOT explain — just the numbered list.`;

export async function plan(task: string): Promise<string> {
  const messages: Message[] = [
    { role: "system", content: plannerPrompt },
    { role: "user", content: task },
  ];
  const response = await callLLM(messages);
  return response.content ?? "";
}
