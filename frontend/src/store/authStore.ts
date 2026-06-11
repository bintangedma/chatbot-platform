import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "../types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      login: (user, token) =>
        set({
          user,
          accessToken: token,
          isAuthenticated: true,
        }),
      logout: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },
      setAccessToken: (token) =>
        set((state) => ({
          accessToken: token,
          isAuthenticated: !!token || !!state.user,
        })),
    }),
    {
      name: "chatbot-platform-auth", // storage persist key
    }
  )
);
export default useAuthStore;
