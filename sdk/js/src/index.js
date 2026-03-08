"use strict";

const DEFAULT_BASE = "https://api.vaaniai.com";

class VaaniClient {
  constructor(config) {
    if (!config || !config.apiKey) throw new Error("VaaniClient: apiKey is required");
    this.apiKey = config.apiKey;
    this.apiBase = (config.apiBase || DEFAULT_BASE).replace(/\/$/, "");
    this.language = config.language || "hi";
    this.targetLanguage = config.targetLanguage || "en";
    this.knowledgeBaseId = config.knowledgeBaseId || null;
  }

  _headers() {
    return {
      Authorization: "Bearer " + this.apiKey,
      "Content-Type": "application/json",
    };
  }

  async _fetch(path, options) {
    const resp = await fetch(this.apiBase + path, {
      headers: this._headers(),
      ...options,
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new Error("VaaniAPI " + resp.status + ": " + body);
    }
    if (resp.status === 204) return null;
    return resp.json();
  }

  async startConversation(overrides) {
    return this._fetch("/api/v1/conversations", {
      method: "POST",
      body: JSON.stringify({
        source_language: (overrides && overrides.language) || this.language,
        target_language: (overrides && overrides.targetLanguage) || this.targetLanguage,
        knowledge_base_id: (overrides && overrides.knowledgeBaseId) || this.knowledgeBaseId,
        mode: "conversation",
      }),
    });
  }

  async sendMessage(conversationId, text) {
    return this._fetch("/api/v1/conversations/" + conversationId + "/message", {
      method: "POST",
      body: JSON.stringify({ content: text }),
    });
  }

  async transcribeAudio(audioBase64, language) {
    return this._fetch("/api/v1/voice/transcribe", {
      method: "POST",
      body: JSON.stringify({
        audio_base64: audioBase64,
        language: language || this.language,
      }),
    });
  }

  async synthesize(text, language, voiceId) {
    return this._fetch("/api/v1/voice/synthesize", {
      method: "POST",
      body: JSON.stringify({
        text,
        language: language || this.targetLanguage,
        voice_id: voiceId || null,
        return_base64: true,
      }),
    });
  }

  async translate(text, sourceLang, targetLang) {
    return this._fetch("/api/v1/voice/translate", {
      method: "POST",
      body: JSON.stringify({
        text,
        source_language: sourceLang,
        target_language: targetLang,
      }),
    });
  }

  async detectLanguage(text) {
    return this._fetch("/api/v1/voice/detect-language", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  }

  async endConversation(conversationId) {
    return this._fetch("/api/v1/conversations/" + conversationId + "/end", {
      method: "POST",
    });
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { VaaniClient };
} else if (typeof window !== "undefined") {
  window.VaaniSDK = { VaaniClient };
}
