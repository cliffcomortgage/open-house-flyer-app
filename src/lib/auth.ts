import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.role = (user as any).role;
        token.userId = user.id;
        // `user` is only populated on an actual sign-in, not on every
        // session check, so this records exactly one event per login.
        await prisma.loginEvent.create({ data: { userId: user.id } }).catch((err) => {
          console.error("Failed to record login event:", err);
        });
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.userId;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // Case-insensitive: logins are typed lowercase far more often than
        // stored emails are, and several accounts have ended up with a
        // mixed-case stored email from however it was typed at creation.
        const user = await prisma.user.findFirst({
          where: { email: { equals: parsed.data.email.trim(), mode: "insensitive" } },
        });

        if (!user || !user.password || !user.isActive) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        return user;
      },
    }),
  ],
});
