import type { Message } from "../types/message";
import { plan } from "./planner";
import { runLoop } from "./agent-loop";

export async function pipeline(history: Message[], userTask: string): Promise<void> {
  process.stdout.write("\nplanning...\n\n");
  const steps = await plan(userTask);

  process.stdout.write("\n\nexecuting...\n\n");
  await runLoop(history, `Task: ${userTask}\n\nPlan:\n${steps}\n\nExecute this plan step by step.`);

  const last = history.at(-1);
  if (last?.role === "assistant") console.log("\nagent:", last.content);
}
