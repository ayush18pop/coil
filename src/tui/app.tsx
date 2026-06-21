import { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { runLoop } from "../agent/agent-loop";
import { systemPrompt } from "../agent/system-prompt";
import type { Message } from "../types/message";

type Line = { role: "user" | "assistant" | "tool"; text: string };

function Label({ role }: { role: Line["role"] }) {
  const text = role === "user" ? "you" : role === "tool" ? "+" : "coil";
  const color = role === "user" ? "cyan" : role === "tool" ? "gray" : "white";
  return (
    <Box width={6} flexShrink={0}>
      <Text color={color} bold={role !== "tool"}>
        {text}
      </Text>
    </Box>
  );
}

export function App() {
  // the agent's real conversation (mutated in place by runLoop)
  const [history] = useState<Message[]>(() => [
    { role: "system", content: systemPrompt },
  ]);
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(value: string) {
    const text = value.trim();
    if (!text || busy) return;

    setInput("");
    setLines((l) => [...l, { role: "user", text }]);
    setBusy(true);
    setStreaming("");

    await runLoop(history, text, {
      onToken: (c) => setStreaming((s) => s + c),
      onTool: (name, args) =>
        setLines((l) => [...l, { role: "tool", text: `${name} ${JSON.stringify(args)}` }]),
    });

    const last = history.at(-1);
    const reply = last?.role === "assistant" ? last.content ?? "" : "";
    setStreaming("");
    setLines((l) => [...l, { role: "assistant", text: reply }]);
    setBusy(false);
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>coil</Text>

      <Box flexDirection="column" marginTop={1}>
        {lines.map((l, i) => (
          <Box key={i} marginBottom={1}>
            <Label role={l.role} />
            <Text dimColor={l.role === "tool"}>{l.text}</Text>
          </Box>
        ))}

        {busy && (
          <Box marginBottom={1}>
            <Label role="assistant" />
            <Text>{streaming || "..."}</Text>
          </Box>
        )}
      </Box>

      <Box>
        <Text color="green">{"> "}</Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={onSubmit}
          placeholder={busy ? "(thinking...)" : "type a message"}
        />
      </Box>
    </Box>
  );
}
