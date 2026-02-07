"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "./apiClient";

export function useRequireAuth(requiredRole?: "admin" | "participant") {
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.accessToken) {
      router.push("/login");
      return;
    }
    if (requiredRole && auth.user?.role !== requiredRole) {
      router.push("/");
    }
  }, [requiredRole, router]);
}
