# Coil

Loops that prove they're done.

Coil is a standard and a runtime for loop engineering. Instead of prompting a coding agent turn by turn, you declare a goal, an objective way to verify it, and a budget. Coil drives an agent toward that goal, loops until the verifier passes, and stops.

Core rule:

> No verify, no run. If you can't express success as a command that exits `0`, it is not a loop.

## How it works

```
goal -> agent acts -> verify (exit 0?) -> pass -> done
                         ^                  |
                         +---- feed failure back <--- no (within budget)
```

Three constraints, enforced by the runtime:

1. Success is a shell command's exit code, not the model's opinion.
2. Every loop declares a budget. It cannot run forever.
3. When a loop can't reach green, it stops and reports why.

## The Loopfile

A loop is a committed file. The runtime rejects one that is missing the required fields.

```yaml
# required
goal: "make the auth test suite pass"
verify: "bun test tests/auth"          # exit 0 = done
budget:
  max_iterations: 8

# optional
backend: builtin                         # builtin | claude-code | opencode
on_fail: report                          # report | revert | open-pr
gates:
  - when: "git push"
    require: approval
```

Each required field removes a failure mode:

| Field | Removes |
|-------|---------|
| `goal` | "too vague to ever be done" |
| `verify` | "the model declares fake victory" |
| `budget` | "runs until the wallet is empty" |

## Backend-agnostic

Coil is the outer loop. It drives whatever agent you point it at: the built-in agent, `claude-code` headless, `opencode`, `pi`. The same Loopfile works across agents.

```ts
interface Backend {
  run(task: string, history: Message[]): Promise<Message[]>;
}
```

## Status

Early, built in the open. What exists today is the built-in agent backend, the inner loop the runtime will drive.

Working now:

- Agent loop: call LLM, execute tools, repeat until done
- Tools: `read_file`, `write_file`, `list_directory`, `grep_search`, `find_files`, `run_command`, `web_search` (auto-registered)
- Streaming responses, multi-turn REPL
- Automatic retries with backoff on transient LLM failures; tool errors fed back to the model instead of crashing
- Any OpenAI-compatible LLM (Ollama, OpenRouter)

Next (the Coil runtime):

- [ ] Loopfile parser and spec (`SPEC.md`)
- [ ] `coil run ./heal.loop`, verify-terminated outer loop
- [ ] Budget and graceful failure (`on_fail`)
- [ ] Human-in-the-loop gates
- [ ] Pluggable backends (claude-code, opencode)
- [ ] Loop composition (a loop that runs other loops)

Target demo: give Coil a failing test suite and a budget, it grinds to green by itself, and stops when it can't.

## Setup

```sh
git clone <repo>
cd coil
bun install
```

Create a `.env`:

```env
LLM_BASE_URL=http://localhost:11434     # Ollama default
LLM_API_KEY=ollama
LLM_MODEL=qwen2.5-coder:7b
TAVILY_API_KEY=                          # for web_search (https://tavily.com)
```

OpenRouter:

```env
LLM_BASE_URL=https://openrouter.ai/api
LLM_API_KEY=sk-or-...
LLM_MODEL=anthropic/claude-sonnet-4-5
```

## Run (built-in agent)

```sh
bun index.ts
```

```
you: read src/llm/llm.ts and explain what it does
agent: [streams response token by token]
you: exit
```

## Adding a tool

1. Create `src/tools/<category>/<name>.ts` and call `registerTool()`
2. Add one import line to `src/tools/index.ts`

```ts
import { registerTool } from "../registry";

registerTool(
  "my_tool",
  { type: "function", function: { name: "my_tool", description: "...", parameters: {} } },
  async (args: { input: string }) => {
    return "result";
  },
);
```

## Project structure

```
index.ts                    # REPL entry point (built-in backend)
src/
  agent/
    agent-loop.ts           # Core while(tool_calls) loop, the inner loop
    agent-core.ts           # Agent class wrapping the loop and history
    pipeline.ts             # Planner to executor orchestration
    planner.ts              # Breaks task into steps
    system-prompt.ts        # Agent instructions
  llm/
    llm.ts                  # Streaming OpenAI-compatible API client
  tools/
    registry.ts             # Tool registration and dispatch
    index.ts                # Imports all tools to trigger registration
    file-system/            # read-file, write-file, list-directory
    shell/                  # run-command
  types/
    message.ts              # Message union (user/assistant/tool/system)
    tool.ts                 # ToolCall type
```

## License

MIT
