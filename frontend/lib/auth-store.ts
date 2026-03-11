import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";

interface AuthState {
  user: { email: string; full_name: string; role: string } | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, user: AuthState["user"], tenantId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenantId: null,
      isAuthenticated: false,
      login: (accessToken, refreshToken, user, tenantId) => {
        Cookies.set("access_token", accessToken, { expires: 1 });
        Cookies.set("refresh_token", refreshToken, { expires: 30 });
        set({ user, tenantId, isAuthenticated: true });
      },
      logout: () => {
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        set({ user: null, tenantId: null, isAuthenticated: false });
      },
    }),
    { name: "vaaniai-auth", skipHydration: true }
  )
);
