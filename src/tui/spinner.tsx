import { useState, useEffect } from "react";
import { Box, Text } from "ink";

// Each style is just a list of frames we cycle through on a timer.
const STYLES = {
  dots: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  arc: ["◜", "◠", "◝", "◞", "◡", "◟"],
  moon: ["◐", "◓", "◑", "◒"],
  bounce: ["⠁", "⠂", "⠄", "⠂"],
  coil: ["(   )", "((  ))", "( () )", "((  ))"],
  coilmini: ["(●  )", "( ● )", "(  ●)", "(  ·)", "( · )", "(·  )"],
  blocks: ["\u28FE", "\u28FD", "\u28FB", "\u28BF", "\u287F", "\u28DF", "\u28EF", "\u28F7"],
  orbit: ["\u25DC", "\u25E0", "\u25DD", "\u25DE", "\u25E1", "\u25DF"],
  pulse: ["·", "•", "●", "•"],
} as const;

type Style = keyof typeof STYLES;

export function Spinner({ style = "dots", color = "cyan", speed = 80 }: {
  style?: Style;
  color?: string;
  speed?: number;
}) {
  const frames = STYLES[style];
  const [i, setI] = useState(0);

  // the whole trick to TUI animation: advance a frame index on an interval,
  // each setState re-renders, Ink redraws only the changed cell
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % frames.length), speed);
    return () => clearInterval(t);
  }, [frames.length, speed]);

  return <Text color={color}>{frames[i]}</Text>;
}

// A small "thinking" indicator with a live elapsed-seconds counter.
export function Thinking({ label = "thinking" }: { label?: string }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <Box>
      <Spinner style="dots" color="cyan" />
      <Text dimColor> {label}</Text>
      <Text dimColor> {secs}s</Text>
    </Box>
  );
}

// A spinning coil/helix. Each row is a ring with a bead; the bead's position
// is offset per row so the beads trace a diagonal, and animating the phase
// makes that diagonal scroll -> the coil looks like it's rotating.
const COIL_ROWS = 6; // number of loops in the coil
const COIL_W = 7; // inner width of each ring
const COIL_CYCLE = 2 * (COIL_W - 1); // bead goes across the front, then back

function ringRow(phase: number): string {
  const pos = ((phase % COIL_CYCLE) + COIL_CYCLE) % COIL_CYCLE;
  const front = pos < COIL_W; // first half = front face, second half = behind
  const idx = front ? pos : COIL_CYCLE - pos;
  const ch = front ? "●" : "·"; // dim dot when the bead is "behind" the coil
  let inner = "";
  for (let k = 0; k < COIL_W; k++) inner += k === idx ? ch : " ";
  return `(${inner})`;
}

export function CoilSpinner({ color = "white", speed = 90 }: {
  color?: string;
  speed?: number;
}) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), speed);
    return () => clearInterval(id);
  }, [speed]);

  return (
    <Box flexDirection="column">
      {Array.from({ length: COIL_ROWS }, (_, r) => (
        <Text key={r} color={color}>
          {ringRow(t + r)}
        </Text>
      ))}
    </Box>
  );
}

// Coil spinner next to a live elapsed-seconds label.
export function CoilLoader({ label = "thinking" }: { label?: string }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <Box>
      <CoilSpinner color="cyan" />
      <Box marginLeft={1} alignItems="flex-end">
        <Text dimColor>
          {label} {secs}s
        </Text>
      </Box>
    </Box>
  );
}

// Small inline coil spinner + elapsed seconds, sits next to the "coil" label.
export function CoilThinking({ label = "thinking" }: { label?: string }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSecs((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <Box>
      <Spinner style="orbit" color="cyan" speed={90} />
      <Text dimColor>
        {" "}
        {label} {secs}s
      </Text>
    </Box>
  );
}
