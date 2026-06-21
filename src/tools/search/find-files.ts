import { Glob } from "bun";
import { registerTool } from "../registry";

const MAX_FILES = 200;

registerTool(
  "find_files",
  {
    type: "function",
    function: {
      name: "find_files",
      description:
        "Find files by a glob pattern (e.g. '**/*.ts', 'src/**/test-*.ts'). Use to locate files by name before reading them.",
      parameters: {
        type: "object",
        properties: {
          pattern: { type: "string", description: "Glob pattern to match file paths" },
          path: { type: "string", description: "Directory to search from (default: current directory)" },
        },
        required: ["pattern"],
      },
    },
  },
  async (args: { pattern: string; path?: string }) => {
    const glob = new Glob(args.pattern);
    const files: string[] = [];
    for await (const f of glob.scan({ cwd: args.path || ".", dot: false })) {
      files.push(f);
      if (files.length >= MAX_FILES) break;
    }
    if (files.length === 0) return `No files match "${args.pattern}".`;
    return files.join("\n");
  },
);
