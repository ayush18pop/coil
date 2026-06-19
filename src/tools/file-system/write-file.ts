export const writeFileSchema = {
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
};

export async function writeFile(path: string, content: string): Promise<void> {
  await Bun.write(path, content);
}
