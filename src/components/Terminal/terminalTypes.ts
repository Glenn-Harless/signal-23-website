export type TerminalMessageType =
  | 'system'
  | 'warning'
  | 'separator'
  | 'typing'
  | 'prompt'
  | 'command'
  | 'output'
  | 'error'
  | 'link';

export interface TerminalMessage {
  type: TerminalMessageType;
  content: string;
}

export interface TerminalCommand {
  name: string;
  label: string;
  execute: () => Promise<TerminalMessage[] | TerminalMessage[]> | TerminalMessage[] | TerminalMessage[];
  isMobileAction?: boolean;
}

export interface TerminalMenuItem {
  command: string;
  label: string;
}

export interface TerminalMediaLink {
  name: string;
  url: string;
}
