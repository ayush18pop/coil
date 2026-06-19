import { readdir } from "node:fs/promises";
import { registerTool } from "../registry";

registerTool(
  "list_directory",
  {
    type: "function",
    function: {
      name: "list_directory",
      description: "List the contents of a directory at the given path",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "The directory path to list" },
        },
        required: ["path"],
      },
    },
  },
  async (args: { path: string }) => {
    try {
      const files = await readdir(args.path);
      return files.join("\n");
    } catch {
      return `Error: directory not found at path "${args.path}"`;
    }
  },
);
