# mini-cursor-agent

A minimal coding agent built from scratch in TypeScript + Bun. Give it a task in plain English, it plans the approach, reads your files, writes code, and runs commands — all in a terminal REPL.

Built as a learning project to understand how agents like Cursor and Claude Code work under the hood.

## How it works

```
you: "add error handling to llm.ts"
         ↓
planner  →  breaks task into concrete steps
         ↓
executor →  reads files, writes changes, runs commands
         ↓
agent:   "Done. Added try/catch around the fetch call."
```

The executor runs a `while` loop: call LLM → if it returns tool calls, execute them and loop back → if it returns plain text, done.

## Stack

- **Runtime**: [Bun](https://bun.sh)
- **Language**: TypeScript
- **LLM**: Any OpenAI-compatible API (Ollama, OpenRouter, etc.)
- **Dependencies**: just `dotenv`

## Setup

```sh
git clone <repo>
cd mini-cursor-agent
bun install
```

Create a `.env`:

```env
LLM_BASE_URL=http://localhost:11434     # Ollama default
LLM_API_KEY=ollama
LLM_MODEL=qwen2.5-coder:7b
```

For OpenRouter:

```env
LLM_BASE_URL=https://openrouter.ai/api
LLM_API_KEY=sk-or-...
LLM_MODEL=anthropic/claude-sonnet-4-5
```

## Run

```sh
bun index.ts
```

```
you: read src/llm/llm.ts and explain what it does
agent: [streams response token by token]

you: exit
```

## Tools

| Tool | What it does |
|------|-------------|
| `read_file` | Read a file's contents |
| `write_file` | Write/overwrite a file |
| `list_directory` | List files in a directory |
| `run_command` | Run a shell command |

## Adding a tool

1. Create `src/tools/<category>/<name>.ts` and call `registerTool()`
2. Add one import line to `src/tools/index.ts`

That's it — the agent loop picks it up automatically.

```ts
import { registerTool } from "../registry";

registerTool(
  "my_tool",
  { type: "function", function: { name: "my_tool", description: "...", parameters: { ... } } },
  async (args: { input: string }) => {
    return "result";
  },
);
```

## Project structure

```
index.ts                    # REPL entry point
src/
  agent/
    agent-loop.ts           # Core while(tool_calls) loop
    pipeline.ts             # Planner → executor orchestration
    planner.ts              # Breaks task into steps
    system-prompt.ts        # Agent instructions
  llm/
    llm.ts                  # Streaming OpenAI-compatible API client
  tools/
    registry.ts             # Tool registration + dispatch
    index.ts                # Imports all tools to trigger registration
    file-system/
      read-file.ts
      write-file.ts
      list-directory.ts
    shell/
      run-command.ts
  types/
    message.ts              # UserMessage, AssistantMessage, ToolMessage, etc.
    tool.ts                 # ToolCall type
```
