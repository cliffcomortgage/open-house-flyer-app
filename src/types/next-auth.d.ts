import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "LO" | "REALTOR";
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "LO" | "REALTOR";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "ADMIN" | "LO" | "REALTOR";
    userId: string;
  }
}
