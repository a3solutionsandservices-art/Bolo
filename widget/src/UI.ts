import { VaaniConfig, VaaniMessage } from "./types";

const WIDGET_CSS = `
.bolo-widget-btn {
  position: fixed;
  bottom: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  transition: transform 0.2s, box-shadow 0.2s;
  z-index: 999999;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
.bolo-widget-btn:hover { transform: scale(1.08); box-shadow: 0 8px 32px rgba(0,0,0,0.24); }
.bolo-widget-btn.bolo-recording { animation: bolo-pulse 1.2s ease-in-out infinite; }
@keyframes bolo-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
  50% { box-shadow: 0 0 0 12px rgba(99,102,241,0); }
}
.bolo-panel {
  position: fixed;
  bottom: 90px;
  width: 360px;
  max-height: 540px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 64px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  z-index: 999998;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow: hidden;
  transform-origin: bottom right;
  transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s;
}
.bolo-panel.bolo-hidden { transform: scale(0.85); opacity: 0; pointer-events: none; }
.bolo-header {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f0f0f0;
}
.bolo-header-left { display: flex; align-items: center; gap: 8px; }
.bolo-header h3 { margin: 0; font-size: 14px; font-weight: 600; color: #111; }
.bolo-header-subtitle { font-size: 11px; color: #888; margin: 0; }
.bolo-close-btn { background: none; border: none; cursor: pointer; color: #888; padding: 4px; border-radius: 6px; font-size: 16px; line-height: 1; }
.bolo-close-btn:hover { background: #f0f0f0; color: #333; }
.bolo-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 200px;
  max-height: 380px;
}
.bolo-message { display: flex; flex-direction: column; max-width: 82%; }
.bolo-message.user { align-self: flex-end; align-items: flex-end; }
.bolo-message.assistant { align-self: flex-start; align-items: flex-start; }
.bolo-bubble {
  padding: 9px 13px;
  border-radius: 14px;
  font-size: 13px;
  line-height: 1.5;
  color: #111;
  max-width: 100%;
  word-break: break-word;
}
.bolo-message.user .bolo-bubble { color: #fff; border-bottom-right-radius: 4px; }
.bolo-message.assistant .bolo-bubble { background: #f4f4f6; border-bottom-left-radius: 4px; }
.bolo-time { font-size: 10px; color: #aaa; margin-top: 3px; }
.bolo-audio-btn { background: none; border: none; cursor: pointer; color: inherit; padding: 2px 0 0 6px; opacity: 0.7; }
.bolo-audio-btn:hover { opacity: 1; }
.bolo-footer {
  padding: 10px 12px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 8px;
  align-items: flex-end;
}
.bolo-text-input {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  padding: 8px 14px;
  font-size: 13px;
  outline: none;
  resize: none;
  font-family: inherit;
  max-height: 80px;
  overflow-y: auto;
  line-height: 1.4;
}
.bolo-text-input:focus { border-color: #6366f1; }
.bolo-mic-btn, .bolo-send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s;
}
.bolo-mic-btn { background: #f0f0f0; color: #555; }
.bolo-mic-btn:hover { background: #e0e0e0; }
.bolo-mic-btn.recording { background: #fee2e2; color: #ef4444; animation: bolo-pulse 1.2s infinite; }
.bolo-send-btn { color: #fff; }
.bolo-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.bolo-lang-bar {
  padding: 6px 12px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 11px;
  color: #888;
}
.bolo-lang-bar select {
  font-size: 11px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 2px 6px;
  background: #fff;
  cursor: pointer;
  color: #333;
}
.bolo-status { font-size: 11px; color: #999; padding: 4px 12px; text-align: center; min-height: 22px; }
`;

const LANGUAGES: [string, string][] = [
  ["en", "English"], ["hi", "Hindi"], ["ta", "Tamil"],
  ["te", "Telugu"], ["bn", "Bengali"], ["gu", "Gujarati"], ["mr", "Marathi"],
];

const MIC_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm6 10a6 6 0 0 1-12 0H4a8 8 0 0 0 7 7.93V21H9v2h6v-2h-2v-2.07A8 8 0 0 0 20 11h-2z"/></svg>`;
const STOP_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`;
const SEND_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>`;
const CHAT_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>`;
const CLOSE_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const PLAY_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;

export class WidgetUI {
  private container!: HTMLDivElement;
  private btn!: HTMLButtonElement;
  private panel!: HTMLDivElement;
  private messagesEl!: HTMLDivElement;
  private textInput!: HTMLTextAreaElement;
  private micBtn!: HTMLButtonElement;
  private sendBtn!: HTMLButtonElement;
  private statusEl!: HTMLDivElement;
  private langFromSelect!: HTMLSelectElement;
  private langToSelect!: HTMLSelectElement;
  private isOpen = false;
  private config: VaaniConfig;

  onSendText?: (text: string) => void;
  onToggleMic?: () => void;
  onLangChange?: (from: string, to: string) => void;

  constructor(config: VaaniConfig) {
    this.config = config;
    this.injectStyles();
    this.container = document.createElement("div");
    document.body.appendChild(this.container);
    this.build();
  }

  private injectStyles() {
    if (document.getElementById("bolo-styles")) return;
    const style = document.createElement("style");
    style.id = "bolo-styles";
    style.textContent = WIDGET_CSS;
    document.head.appendChild(style);
  }

  private build() {
    const color = this.config.primaryColor || "#6366f1";
    const position = this.config.position || "bottom-right";
    const side = position === "bottom-left" ? "left: 24px" : "right: 24px";

    this.btn = document.createElement("button");
    this.btn.className = "bolo-widget-btn";
    this.btn.style.cssText = `${side}; background: ${color};`;
    this.btn.innerHTML = CHAT_SVG;
    this.btn.title = this.config.widgetName || "Bolo";
    this.btn.addEventListener("click", () => this.toggle());
    this.container.appendChild(this.btn);

    this.panel = document.createElement("div");
    this.panel.className = "bolo-panel bolo-hidden";
    this.panel.style.cssText = `${side};`;

    const header = document.createElement("div");
    header.className = "bolo-header";
    header.innerHTML = `
      <div class="bolo-header-left">
        ${this.config.logoUrl ? `<img src="${this.config.logoUrl}" alt="" style="width:28px;height:28px;border-radius:6px;object-fit:cover">` : `<div style="width:28px;height:28px;border-radius:6px;background:${color};display:flex;align-items:center;justify-content:center">${CHAT_SVG.replace('24" height="24"', '16" height="16"')}</div>`}
        <div>
          <h3>${this.config.widgetName || "Bolo"}</h3>
          <p class="bolo-header-subtitle">AI Voice Assistant</p>
        </div>
      </div>
      <button class="bolo-close-btn">${CLOSE_SVG}</button>
    `;
    header.querySelector(".bolo-close-btn")!.addEventListener("click", () => this.close());

    const langBar = document.createElement("div");
    langBar.className = "bolo-lang-bar";
    this.langFromSelect = document.createElement("select");
    this.langToSelect = document.createElement("select");
    LANGUAGES.forEach(([code, name]) => {
      const opt1 = new Option(name, code, code === (this.config.language || "en"), code === (this.config.language || "en"));
      const opt2 = new Option(name, code, code === (this.config.targetLanguage || "hi"), code === (this.config.targetLanguage || "hi"));
      this.langFromSelect.add(opt1);
      this.langToSelect.add(opt2);
    });
    const handleLangChange = () => this.onLangChange?.(this.langFromSelect.value, this.langToSelect.value);
    this.langFromSelect.addEventListener("change", handleLangChange);
    this.langToSelect.addEventListener("change", handleLangChange);
    langBar.appendChild(document.createTextNode("From: "));
    langBar.appendChild(this.langFromSelect);
    langBar.appendChild(document.createTextNode(" To: "));
    langBar.appendChild(this.langToSelect);

    this.messagesEl = document.createElement("div");
    this.messagesEl.className = "bolo-messages";

    this.statusEl = document.createElement("div");
    this.statusEl.className = "bolo-status";

    const footer = document.createElement("div");
    footer.className = "bolo-footer";

    this.textInput = document.createElement("textarea");
    this.textInput.className = "bolo-text-input";
    this.textInput.placeholder = "Type a message...";
    this.textInput.rows = 1;
    this.textInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });
    this.textInput.addEventListener("input", () => {
      this.textInput.style.height = "auto";
      this.textInput.style.height = Math.min(this.textInput.scrollHeight, 80) + "px";
    });

    this.micBtn = document.createElement("button");
    this.micBtn.className = "bolo-mic-btn";
    this.micBtn.innerHTML = MIC_SVG;
    this.micBtn.title = "Hold to speak";
    this.micBtn.addEventListener("click", () => this.onToggleMic?.());

    this.sendBtn = document.createElement("button");
    this.sendBtn.className = "bolo-send-btn";
    this.sendBtn.style.background = color;
    this.sendBtn.innerHTML = SEND_SVG;
    this.sendBtn.addEventListener("click", () => this.handleSend());

    footer.append(this.textInput, this.micBtn, this.sendBtn);
    this.panel.append(header, langBar, this.messagesEl, this.statusEl, footer);
    this.container.appendChild(this.panel);
  }

  private handleSend() {
    const text = this.textInput.value.trim();
    if (!text) return;
    this.textInput.value = "";
    this.textInput.style.height = "auto";
    this.onSendText?.(text);
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.isOpen = true;
    this.panel.classList.remove("bolo-hidden");
  }

  close() {
    this.isOpen = false;
    this.panel.classList.add("bolo-hidden");
  }

  addMessage(msg: { role: "user" | "assistant"; text: string; audioUrl?: string }) {
    const wrapper = document.createElement("div");
    wrapper.className = `bolo-message ${msg.role}`;

    const bubble = document.createElement("div");
    bubble.className = "bolo-bubble";
    if (msg.role === "user") {
      bubble.style.background = this.config.primaryColor || "#6366f1";
    }
    bubble.textContent = msg.text;

    if (msg.audioUrl) {
      const playBtn = document.createElement("button");
      playBtn.className = "bolo-audio-btn";
      playBtn.innerHTML = PLAY_SVG;
      playBtn.title = "Play audio";
      playBtn.addEventListener("click", () => {
        const audio = new Audio(msg.audioUrl!);
        audio.play();
      });
      bubble.appendChild(playBtn);
    }

    const time = document.createElement("span");
    time.className = "bolo-time";
    time.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    wrapper.append(bubble, time);
    this.messagesEl.appendChild(wrapper);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  setStatus(text: string) {
    this.statusEl.textContent = text;
  }

  setMicRecording(recording: boolean) {
    this.micBtn.innerHTML = recording ? STOP_SVG : MIC_SVG;
    this.micBtn.classList.toggle("recording", recording);
  }

  destroy() {
    this.container.remove();
  }
}
