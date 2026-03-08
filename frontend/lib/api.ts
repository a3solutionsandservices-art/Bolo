import axios from "axios";
import Cookies from "js-cookie";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = Cookies.get("refresh_token");
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh`,
            { refresh_token: refreshToken }
          );
          Cookies.set("access_token", data.access_token, { expires: 1 });
          error.config.headers.Authorization = `Bearer ${data.access_token}`;
          return apiClient(error.config);
        } catch {
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiClient.post("/api/v1/auth/login", { email, password }),
    register: (data: { email: string; password: string; full_name: string; tenant_name: string; tenant_slug: string }) =>
      apiClient.post("/api/v1/auth/register", data),
    createApiKey: (name: string, scopes?: string[]) =>
      apiClient.post("/api/v1/auth/api-keys", { name, scopes }),
    listApiKeys: () => apiClient.get("/api/v1/auth/api-keys"),
    revokeApiKey: (id: string) => apiClient.delete(`/api/v1/auth/api-keys/${id}`),
  },

  voice: {
    transcribe: (audio: File, language?: string) => {
      const form = new FormData();
      form.append("audio", audio);
      if (language) form.append("language", language);
      return apiClient.post("/api/v1/voice/transcribe", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    synthesize: (text: string, language: string, voiceId?: string) =>
      apiClient.post("/api/v1/voice/synthesize", { text, language, voice_id: voiceId, return_base64: true }),
    translate: (text: string, sourceLang: string, targetLang: string) =>
      apiClient.post("/api/v1/voice/translate", {
        text, source_language: sourceLang, target_language: targetLang,
      }),
    detectLanguage: (text: string) =>
      apiClient.post("/api/v1/voice/detect-language", { text }),
  },

  conversations: {
    start: (data: { mode?: string; source_language?: string; target_language?: string; knowledge_base_id?: string }) =>
      apiClient.post("/api/v1/conversations", data),
    list: (skip?: number, limit?: number) =>
      apiClient.get("/api/v1/conversations", { params: { skip, limit } }),
    get: (id: string) => apiClient.get(`/api/v1/conversations/${id}`),
    sendMessage: (id: string, content: string) =>
      apiClient.post(`/api/v1/conversations/${id}/message`, { content }),
    getTranscript: (id: string, format?: string) =>
      apiClient.get(`/api/v1/conversations/${id}/transcript`, { params: { format } }),
    end: (id: string) => apiClient.patch(`/api/v1/conversations/${id}/end`),
  },

  knowledge: {
    list: () => apiClient.get("/api/v1/knowledge-bases"),
    create: (name: string, description?: string, languages?: string[]) =>
      apiClient.post("/api/v1/knowledge-bases", { name, description, languages }),
    uploadDocument: (kbId: string, file: File, title: string, language?: string) => {
      const form = new FormData();
      form.append("file", file);
      form.append("title", title);
      if (language) form.append("language", language);
      return apiClient.post(`/api/v1/knowledge-bases/${kbId}/documents`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    listDocuments: (kbId: string) => apiClient.get(`/api/v1/knowledge-bases/${kbId}/documents`),
    deleteDocument: (kbId: string, docId: string) =>
      apiClient.delete(`/api/v1/knowledge-bases/${kbId}/documents/${docId}`),
    query: (kbId: string, question: string) =>
      apiClient.post(`/api/v1/knowledge-bases/${kbId}/query`, null, { params: { question } }),
  },

  analytics: {
    overview: (days?: number) => apiClient.get("/api/v1/analytics/overview", { params: { days } }),
    conversations: (days?: number) => apiClient.get("/api/v1/analytics/conversations", { params: { days } }),
    languages: (days?: number) => apiClient.get("/api/v1/analytics/languages", { params: { days } }),
    latency: (days?: number) => apiClient.get("/api/v1/analytics/latency", { params: { days } }),
  },

  billing: {
    plans: () => apiClient.get("/api/v1/billing/plans"),
    subscribe: (plan_tier: string, success_url: string, cancel_url: string) =>
      apiClient.post("/api/v1/billing/subscribe", { plan_tier, success_url, cancel_url }),
    portal: (return_url: string) =>
      apiClient.post("/api/v1/billing/portal", null, { params: { return_url } }),
    usage: () => apiClient.get("/api/v1/billing/usage"),
    subscription: () => apiClient.get("/api/v1/billing/subscription"),
  },

  tenant: {
    me: () => apiClient.get("/api/v1/tenants/me"),
    update: (data: Record<string, unknown>) => apiClient.patch("/api/v1/tenants/me", data),
    widgetConfig: () => apiClient.get("/api/v1/tenants/me/widget-config"),
  },

  voiceClones: {
    list: () => apiClient.get("/api/v1/voice-clones"),
    create: (data: { name: string; description?: string; language: string }) =>
      apiClient.post("/api/v1/voice-clones", data),
    uploadSample: (id: string, audio: File) => {
      const form = new FormData();
      form.append("audio", audio);
      return apiClient.post(`/api/v1/voice-clones/${id}/samples`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    train: (id: string) => apiClient.post(`/api/v1/voice-clones/${id}/train`),
    setDefault: (id: string) => apiClient.patch(`/api/v1/voice-clones/${id}/default`),
    delete: (id: string) => apiClient.delete(`/api/v1/voice-clones/${id}`),
  },
};
