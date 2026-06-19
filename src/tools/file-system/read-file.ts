export const readFileSchema = {
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
};

export async function readFile(path: string): Promise<string> {
  return Bun.file(path).text();
}
