import { registerTool } from "../registry";

const MAX_LINES = 100;

registerTool(
  "grep_search",
  {
    type: "function",
    function: {
      name: "grep_search",
      description:
        "Search file contents across the project for a pattern (regex). Returns matching file:line:text. Use to find where something is defined or used.",
      parameters: {
        type: "object",
        properties: {
          pattern: { type: "string", description: "The regex or text to search for" },
          path: { type: "string", description: "Directory or file to search (default: current directory)" },
        },
        required: ["pattern"],
      },
    },
  },
  async (args: { pattern: string; path?: string }) => {
    const path = args.path || ".";

    // prefer ripgrep, fall back to grep
    let out = await Bun.$`rg --line-number --no-heading --color never -e ${args.pattern} ${path}`
      .nothrow()
      .quiet()
      .then((r) => (r.exitCode === 0 || r.exitCode === 1 ? r.stdout.toString() : null))
      .catch(() => null);

    if (out === null) {
      out = await Bun.$`grep -rn -e ${args.pattern} ${path}`
        .nothrow()
        .quiet()
        .then((r) => (r.exitCode === 0 || r.exitCode === 1 ? r.stdout.toString() : null))
        .catch(() => null);
    }

    if (out === null) return "Error: neither ripgrep nor grep is available.";
    if (!out.trim()) return `No matches for "${args.pattern}".`;

    const lines = out.trim().split("\n");
    const shown = lines.slice(0, MAX_LINES).join("\n");
    return lines.length > MAX_LINES
      ? `${shown}\n... (${lines.length - MAX_LINES} more matches, refine your pattern)`
      : shown;
  },
);
