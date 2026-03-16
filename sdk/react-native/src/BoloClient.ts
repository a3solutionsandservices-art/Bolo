export interface VaaniConfig {
  apiKey: string;
  apiBase?: string;
  language?: string;
  targetLanguage?: string;
  knowledgeBaseId?: string;
}

export interface TranscribeResult {
  text: string;
  language: string;
  confidence: number;
  duration_seconds: number;
}

export interface MessageResult {
  id: string;
  text: string;
  translated_text?: string;
  audio_url?: string;
  sentiment?: string;
  intent?: string;
  rag_sources?: Array<{ title: string; score: number }>;
}

export interface ConversationResult {
  id: string;
  session_id: string;
  mode: string;
  status: string;
}

const DEFAULT_BASE = "https://api.boloai.com";

export class BoloClient {
  private apiKey: string;
  private apiBase: string;
  private language: string;
  private targetLanguage: string;
  private knowledgeBaseId?: string;

  constructor(config: VaaniConfig) {
    this.apiKey = config.apiKey;
    this.apiBase = (config.apiBase ?? DEFAULT_BASE).replace(/\/$/, "");
    this.language = config.language ?? "hi";
    this.targetLanguage = config.targetLanguage ?? "en";
    this.knowledgeBaseId = config.knowledgeBaseId;
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async startConversation(overrides?: Partial<VaaniConfig>): Promise<ConversationResult> {
    const resp = await fetch(`${this.apiBase}/api/v1/conversations`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        source_language: overrides?.language ?? this.language,
        target_language: overrides?.targetLanguage ?? this.targetLanguage,
        knowledge_base_id: overrides?.knowledgeBaseId ?? this.knowledgeBaseId,
        mode: "conversation",
      }),
    });
    if (!resp.ok) throw new Error(`startConversation failed: ${resp.status}`);
    return resp.json();
  }

  async sendMessage(conversationId: string, text: string): Promise<MessageResult> {
    const resp = await fetch(`${this.apiBase}/api/v1/conversations/${conversationId}/message`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ content: text }),
    });
    if (!resp.ok) throw new Error(`sendMessage failed: ${resp.status}`);
    return resp.json();
  }

  async transcribeAudio(audioBase64: string, language?: string): Promise<TranscribeResult> {
    const resp = await fetch(`${this.apiBase}/api/v1/voice/transcribe`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        audio_base64: audioBase64,
        language: language ?? this.language,
      }),
    });
    if (!resp.ok) throw new Error(`transcribeAudio failed: ${resp.status}`);
    return resp.json();
  }

  async synthesize(
    text: string,
    language?: string,
    voiceId?: string,
  ): Promise<{ audio_base64: string; audio_format: string }> {
    const resp = await fetch(`${this.apiBase}/api/v1/voice/synthesize`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        text,
        language: language ?? this.targetLanguage,
        voice_id: voiceId,
        return_base64: true,
      }),
    });
    if (!resp.ok) throw new Error(`synthesize failed: ${resp.status}`);
    return resp.json();
  }

  async translate(text: string, sourceLang: string, targetLang: string): Promise<{ translated_text: string }> {
    const resp = await fetch(`${this.apiBase}/api/v1/voice/translate`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        text,
        source_language: sourceLang,
        target_language: targetLang,
      }),
    });
    if (!resp.ok) throw new Error(`translate failed: ${resp.status}`);
    return resp.json();
  }

  async detectLanguage(text: string): Promise<{ language: string; confidence: number; language_name: string }> {
    const resp = await fetch(`${this.apiBase}/api/v1/voice/detect-language`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ text }),
    });
    if (!resp.ok) throw new Error(`detectLanguage failed: ${resp.status}`);
    return resp.json();
  }

  async endConversation(conversationId: string): Promise<void> {
    await fetch(`${this.apiBase}/api/v1/conversations/${conversationId}/end`, {
      method: "POST",
      headers: this.headers,
    });
  }
}
