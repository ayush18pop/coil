import { registerTool } from "../../tools/registry";

registerTool(
  "run_command",
  {
    type: "function",
    function: {
      name: "run_command",
      description: "Run a shell command and return its output",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "The shell command to run" },
        },
        required: ["command"],
      },
    },
  },
  async (args: { command: string }) => Bun.$`sh -c ${args.command}`.nothrow().text(),
);
