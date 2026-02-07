"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { hydrateFromStorage } from "./authSlice";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const raw = window.localStorage.getItem("auth");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      store.dispatch(
        hydrateFromStorage({
          user: parsed.user || null,
          accessToken: parsed.accessToken || null,
          refreshToken: parsed.refreshToken || null,
        }),
      );
    } catch {
      // ignore malformed storage
    }
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
