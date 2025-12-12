"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

/**
 * NextAuth SessionProviderのラッパー
 * Client Componentとして分離
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
