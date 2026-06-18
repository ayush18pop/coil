export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: string;
}

export interface ToolMessage {
  role: "tool";
  content: string;
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
