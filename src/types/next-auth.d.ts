import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "LO";
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "LO";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "ADMIN" | "LO";
    userId: string;
  }
}
