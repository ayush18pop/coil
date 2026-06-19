import { registerTool } from "../registry";

registerTool(
  "read_file",
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read the contents of a file at the given path",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "The file path to read" },
        },
        required: ["path"],
      },
    },
  },
  async (args: { path: string }) => Bun.file(args.path).text(),
);
