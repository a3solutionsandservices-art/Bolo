import { useState, useRef, useCallback } from "react";
import { VaaniClient, VaaniConfig, MessageResult } from "./VaaniClient";

export interface VaaniMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  audioUrl?: string;
  timestamp: Date;
}

export interface UseVaaniReturn {
  messages: VaaniMessage[];
  isLoading: boolean;
  isRecording: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  startRecording: () => void;
  stopRecording: () => void;
  clearMessages: () => void;
}

export function useVaani(config: VaaniConfig): UseVaaniReturn {
  const clientRef = useRef<VaaniClient>(new VaaniClient(config));
  const conversationIdRef = useRef<string | null>(null);

  const [messages, setMessages] = useState<VaaniMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensureConversation = useCallback(async (): Promise<string> => {
    if (!conversationIdRef.current) {
      const conv = await clientRef.current.startConversation();
      conversationIdRef.current = conv.id;
    }
    return conversationIdRef.current;
  }, []);

  const sendMessage = useCallback(async (text: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    const userMsg: VaaniMessage = {
      id: Date.now().toString(),
      role: "user",
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const convId = await ensureConversation();
      const result: MessageResult = await clientRef.current.sendMessage(convId, text);

      const assistantMsg: VaaniMessage = {
        id: result.id ?? (Date.now() + 1).toString(),
        role: "assistant",
        text: result.text,
        audioUrl: result.audio_url,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [ensureConversation]);

  const startRecording = useCallback(() => {
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    conversationIdRef.current = null;
  }, []);

  return {
    messages,
    isLoading,
    isRecording,
    error,
    sendMessage,
    startRecording,
    stopRecording,
    clearMessages,
  };
}
