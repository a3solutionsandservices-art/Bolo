import { VaaniConfig, VaaniMessage } from "./types";
import { AudioCapture } from "./AudioCapture";
import { APIClient } from "./APIClient";
import { WidgetUI } from "./UI";

export class VaaniWidgetInstance {
  private config: VaaniConfig;
  private ui: WidgetUI;
  private api: APIClient;
  private audio: AudioCapture;
  private conversationId: string | null = null;
  private messages: VaaniMessage[] = [];

  constructor(config: VaaniConfig) {
    this.config = config;
    this.ui = new WidgetUI(config);
    this.api = new APIClient(config);
    this.audio = new AudioCapture();
    this.setup();
  }

  private setup() {
    this.ui.onSendText = async (text) => {
      await this.handleTextMessage(text);
    };

    this.ui.onToggleMic = async () => {
      if (this.audio.active) {
        await this.stopRecording();
      } else {
        await this.startRecording();
      }
    };

    this.ui.onLangChange = (from, to) => {
      this.config.language = from;
      this.config.targetLanguage = to;
      this.api = new APIClient(this.config);
      this.conversationId = null;
      this.ui.setStatus("Language changed — new conversation will start.");
    };
  }

  private async ensureConversation(): Promise<string> {
    if (!this.conversationId) {
      this.ui.setStatus("Starting conversation...");
      this.conversationId = await this.api.startConversation();
      this.ui.setStatus("");
    }
    return this.conversationId;
  }

  private async handleTextMessage(text: string) {
    this.ui.addMessage({ role: "user", text });
    this.messages.push({ id: Date.now().toString(), role: "user", text, timestamp: new Date() });
    this.ui.setStatus("Thinking...");

    try {
      const convId = await this.ensureConversation();
      const response = await this.api.sendMessage(convId, text);
      this.ui.addMessage({ role: "assistant", text: response.text, audioUrl: response.audioUrl });
      this.messages.push(response);

      if (response.audioUrl) {
        this.playAudio(response.audioUrl);
      }
      this.ui.setStatus("");
      this.config.onMessage?.(response);
    } catch (e) {
      this.ui.setStatus("Error — please try again");
      this.config.onError?.(e instanceof Error ? e : new Error(String(e)));
    }
  }

  private async startRecording() {
    const granted = await this.audio.requestPermission();
    if (!granted) {
      this.ui.setStatus("Microphone permission denied");
      return;
    }
    this.ui.setMicRecording(true);
    this.ui.setStatus("Listening...");
    await this.audio.start(() => {});
  }

  private async stopRecording() {
    this.ui.setMicRecording(false);
    this.ui.setStatus("Processing...");
    const blob = await this.audio.stop();

    try {
      const text = await this.api.transcribeAudio(blob, this.config.language);
      if (text.trim()) {
        await this.handleTextMessage(text);
      } else {
        this.ui.setStatus("Could not detect speech — try again");
        setTimeout(() => this.ui.setStatus(""), 3000);
      }
    } catch {
      this.ui.setStatus("Transcription failed");
      setTimeout(() => this.ui.setStatus(""), 3000);
    }
  }

  private playAudio(url: string) {
    const audio = new Audio(url);
    audio.play().catch(() => {});
  }

  open() { this.ui.open(); }
  close() { this.ui.close(); }

  setLanguage(lang: string) {
    this.config.language = lang;
    this.api = new APIClient(this.config);
    this.conversationId = null;
  }

  destroy() {
    this.audio.destroy();
    this.api.destroy();
    this.ui.destroy();
  }
}
