"use client";

export function getAuth() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("auth");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as {
      user?: { id: string; name: string; email: string; role: string };
      accessToken?: string;
      refreshToken?: string;
    };
  } catch {
    return null;
  }
}

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const auth = getAuth();
  const headers = new Headers(init.headers || {});
  if (auth?.accessToken) {
    headers.set("Authorization", `Bearer ${auth.accessToken}`);
  }
  return fetch(input, { ...init, headers });
}
