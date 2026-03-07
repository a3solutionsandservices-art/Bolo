export class AudioCapture {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private isRecording = false;

  async requestPermission(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch {
      return false;
    }
  }

  async start(onChunk: (chunk: Blob) => void): Promise<void> {
    if (!this.stream) {
      const granted = await this.requestPermission();
      if (!granted) throw new Error("Microphone permission denied");
    }

    this.chunks = [];
    this.isRecording = true;

    const options = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? { mimeType: "audio/webm;codecs=opus" }
      : { mimeType: "audio/webm" };

    this.mediaRecorder = new MediaRecorder(this.stream!, options);

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
        onChunk(e.data);
      }
    };

    this.mediaRecorder.start(1000);
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve(new Blob([], { type: "audio/webm" }));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: "audio/webm" });
        this.chunks = [];
        this.isRecording = false;
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  get active(): boolean {
    return this.isRecording;
  }

  destroy(): void {
    this.stop().catch(() => {});
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }
}
