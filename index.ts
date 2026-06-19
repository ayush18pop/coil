import { runLoop } from "./src/agent/agent-loop";

await runLoop(
  {
    systemMessage: {
      role: "system",
      content:
        "You are a coding assistant. Use the read_file tool to read files when needed. Use the write_file tool to write files when needed. If you need to read a file, call the read_file tool with the path of the file. If you need to write a file, call the write_file tool with the path and content of the file.",
    },
    userMessages: [],
  },
  {
    role: "user",
    content:
      "Read src/tools/file-system/read-file.ts and src/tools/file-system/write-file.ts, then write an explanation of both files to src/tools/file-system/explaination.md in a proper highly detailed manner. The explanation should be in markdown format and should be at least 300 words long.",
  },
);
