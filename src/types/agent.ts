import type { SystemMessage, UserMessage } from "./message";

export type InitialContext = {
  systemMessage: SystemMessage;
  userMessages: UserMessage[];
};
