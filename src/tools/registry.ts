type Tool = {
  schema: object;
  execute: (args: any) => Promise<string>;
};

const registry: Record<string, Tool> = {};

export function registerTool<T>(
  name: string,
  schema: object,
  execute: (args: T) => Promise<string>,
) {
  registry[name] = { schema, execute };
}

export function getSchemas(): object[] {
  return Object.values(registry).map((t) => t.schema);
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  const tool = registry[name];
  if (!tool) return `Unknown tool: ${name}`;
  return tool.execute(args);
}
