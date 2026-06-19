export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: string | null;
  tool_calls?: {
    id: string;
    type: string;
    function: { name: string; arguments: string };
  }[];
}

export interface ToolMessage {
  role: "tool";
  content: string;
  tool_call_id: string;
}

export interface SystemMessage {
  role: "system";
  content: string;
}

export type Message =
  | UserMessage
  | AssistantMessage
  | ToolMessage
  | SystemMessage;
