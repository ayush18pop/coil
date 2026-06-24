import { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { CoilThinking } from "./spinner";
import { runLoop } from "../agent/agent-loop";
import { systemPrompt } from "../agent/system-prompt";
import {
  createSession,
  saveSession,
  loadSession,
  listSessions,
  type Session,
} from "../session/session";

type Line = { role: "user" | "assistant" | "tool" | "system"; text: string };

function summarizeArgs(args: unknown): string {
  if (!args || typeof args !== "object") return String(args ?? "");
  return Object.entries(args as Record<string, unknown>)
    .map(([k, v]) => {
      const val = typeof v === "string" ? v : JSON.stringify(v);
      const clipped = val.length > 50 ? val.slice(0, 50) + "…" : val;
      return `${k}: ${clipped}`;
    })
    .join("  ");
}

// Rebuild the visible transcript from a loaded session's messages.
function linesFromSession(session: Session): Line[] {
  const out: Line[] = [];
  for (const m of session.messages) {
    if (m.role === "user") {
      out.push({ role: "user", text: m.content });
    } else if (m.role === "assistant") {
      if (m.content) out.push({ role: "assistant", text: m.content });
      for (const tc of m.tool_calls ?? []) {
        let args: unknown;
        try {
          args = JSON.parse(tc.function.arguments);
        } catch {
          args = tc.function.arguments;
        }
        out.push({ role: "tool", text: `${tc.function.name}  ${summarizeArgs(args)}` });
      }
    }
  }
  return out;
}

function Label({ role }: { role: Line["role"] }) {
  const text =
    role === "user" ? "you" : role === "tool" ? "+" : role === "system" ? "·" : "coil";
  const color =
    role === "user" ? "cyan" : role === "assistant" ? "white" : "gray";
  return (
    <Box width={6} flexShrink={0}>
      <Text color={color} bold={role === "user" || role === "assistant"}>
        {text}
      </Text>
    </Box>
  );
}

export function App() {
  const [session, setSession] = useState<Session>(() => createSession(systemPrompt));
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);

  function info(text: string) {
    setLines((l) => [...l, { role: "system", text }]);
  }

  function handleCommand(cmd: string) {
    const [name, ...rest] = cmd.slice(1).split(" ");
    const arg = rest.join(" ").trim();

    if (name === "new") {
      setSession(createSession(systemPrompt));
      setLines([]);
      info("started a new chat");
    } else if (name === "list") {
      const all = listSessions();
      if (all.length === 0) info("no saved chats yet");
      else all.forEach((s) => info(`${s.id}  ${s.title}`));
    } else if (name === "resume") {
      const loaded = arg ? loadSession(arg) : null;
      if (!loaded) info(`no chat with id "${arg}" (use /list)`);
      else {
        setSession(loaded);
        setLines(linesFromSession(loaded));
        info(`resumed ${loaded.id}`);
      }
    } else if (name === "help") {
      info("/new  /list  /resume <id>  /help");
    } else {
      info(`unknown command: /${name}`);
    }
  }

  async function onSubmit(value: string) {
    const text = value.trim();
    if (!text || busy) return;
    setInput("");

    if (text.startsWith("/")) {
      handleCommand(text);
      return;
    }

    setLines((l) => [...l, { role: "user", text }]);
    setBusy(true);
    setStreaming("");

    await runLoop(session.messages, text, {
      onToken: (c) => setStreaming((s) => s + c),
      onTool: (name, args) =>
        setLines((l) => [...l, { role: "tool", text: `${name}  ${summarizeArgs(args)}` }]),
    });

    const last = session.messages.at(-1);
    const reply = last?.role === "assistant" ? last.content ?? "" : "";
    setStreaming("");
    setLines((l) => [...l, { role: "assistant", text: reply }]);
    setBusy(false);

    // persist the chat after every completed turn
    saveSession(session);
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box>
        <Text bold>coil</Text>
        <Text dimColor>  {session.title === "untitled" ? "new chat" : session.title} ({session.id})</Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        {lines.map((l, i) => (
          <Box key={i} marginBottom={1}>
            <Label role={l.role} />
            <Text dimColor={l.role === "tool" || l.role === "system"}>{l.text}</Text>
          </Box>
        ))}

        {busy &&
          (streaming ? (
            <Box marginBottom={1}>
              <Label role="assistant" />
              <Text>{streaming}</Text>
            </Box>
          ) : (
            <Box marginBottom={1}>
              <Label role="assistant" />
              <CoilThinking />
            </Box>
          ))}
      </Box>

      <Box>
        <Text color="green">{"> "}</Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={onSubmit}
          placeholder={busy ? "(thinking...)" : "type a message, or /help"}
        />
      </Box>
    </Box>
  );
}
