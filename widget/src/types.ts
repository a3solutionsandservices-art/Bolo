export interface VaaniConfig {
  tenantId: string;
  apiEndpoint: string;
  language?: string;
  targetLanguage?: string;
  mode?: "translation" | "conversation" | "agent";
  knowledgeBaseId?: string;
  primaryColor?: string;
  widgetName?: string;
  logoUrl?: string;
  position?: "bottom-right" | "bottom-left";
  onReady?: () => void;
  onMessage?: (message: VaaniMessage) => void;
  onError?: (error: Error) => void;
}

export interface VaaniMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  audioUrl?: string;
  timestamp: Date;
}

export type VaaniCommand = "init" | "open" | "close" | "destroy" | "setLanguage" | "sendMessage";
