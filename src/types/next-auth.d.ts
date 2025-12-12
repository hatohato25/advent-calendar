import "next-auth";
import type { UserRole } from "./user";

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    allowedDates?: string | null; // JSON配列文字列
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      allowedDates: number[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    allowedDates: number[];
  }
}
