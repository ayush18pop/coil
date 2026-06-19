import { registerTool } from "../registry";

registerTool(
  "write_file",
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Write content to a file at the given path",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "The file path to write to" },
          content: {
            type: "string",
            description: "The content to write to the file",
          },
        },
        required: ["path", "content"],
      },
    },
  },
  async (args: { path: string; content: string }) => {
    await Bun.write(args.path, args.content);
    return `Successfully wrote to ${args.path}`;
  },
);
