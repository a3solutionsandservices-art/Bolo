import { VaaniConfig, VaaniMessage } from "./types";

export class APIClient {
  private config: VaaniConfig;
  private sessionId: string | null = null;
  private ws: WebSocket | null = null;

  constructor(config: VaaniConfig) {
    this.config = config;
  }

  private get authHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.config.apiKey}`,
    };
  }

  async startConversation(): Promise<string> {
    const res = await fetch(`${this.config.apiEndpoint}/api/v1/conversations`, {
      method: "POST",
      headers: this.authHeaders,
      body: JSON.stringify({
        mode: this.config.mode || "conversation",
        source_language: this.config.language || "en",
        target_language: this.config.targetLanguage || "hi",
        knowledge_base_id: this.config.knowledgeBaseId,
      }),
    });
    if (!res.ok) throw new Error("Failed to start conversation");
    const data = await res.json();
    this.sessionId = data.id;
    return data.id;
  }

  async sendMessage(conversationId: string, text: string): Promise<VaaniMessage> {
    const res = await fetch(
      `${this.config.apiEndpoint}/api/v1/conversations/${conversationId}/message`,
      {
        method: "POST",
        headers: this.authHeaders,
        body: JSON.stringify({ content: text }),
      }
    );
    if (!res.ok) throw new Error("Failed to send message");
    const data = await res.json();
    return {
      id: data.message_id,
      role: "assistant",
      text: data.text,
      audioUrl: data.audio_base64 ? `data:audio/wav;base64,${data.audio_base64}` : undefined,
      timestamp: new Date(),
    };
  }

  async transcribeAudio(audioBlob: Blob, language?: string): Promise<string> {
    const form = new FormData();
    form.append("audio", audioBlob, "audio.webm");
    if (language) form.append("language", language);

    const res = await fetch(`${this.config.apiEndpoint}/api/v1/voice/transcribe`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${this.config.apiKey}` },
      body: form,
    });
    if (!res.ok) throw new Error("Transcription failed");
    const data = await res.json();
    return data.text;
  }

  connectWebSocket(
    onTranscript: (text: string, lang: string) => void,
    onAudio: (audioB64: string) => void,
    onError: (msg: string) => void
  ): void {
    const wsUrl = this.config.apiEndpoint.replace("https://", "wss://").replace("http://", "ws://");
    const params = new URLSearchParams({
      token: this.config.apiKey,
      source_language: this.config.language || "auto",
      target_language: this.config.targetLanguage || "en",
      mode: this.config.mode || "conversation",
    });
    this.ws = new WebSocket(`${wsUrl}/api/v1/voice/stream?${params}`);

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "transcript") onTranscript(msg.text, msg.language);
        else if (msg.type === "audio") onAudio(msg.data);
        else if (msg.type === "error") onError(msg.message);
      } catch {}
    };
  }

  sendAudioChunk(chunk: Blob): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      chunk.arrayBuffer().then((buf) => this.ws?.send(buf));
    }
  }

  closeWebSocket(): void {
    if (this.ws) {
      this.ws.send(JSON.stringify({ type: "end" }));
      this.ws.close();
      this.ws = null;
    }
  }

  destroy(): void {
    this.closeWebSocket();
  }
}
