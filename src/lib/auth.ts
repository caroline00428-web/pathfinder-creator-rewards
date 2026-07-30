import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";

declare module "next-auth" {
  interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    creatorId?: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      username: string;
      role: string;
      creatorId?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    email: string;
    role: string;
    creatorId?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[AUTH] authorize() called");
        console.log("[AUTH] credentials:", credentials ? "exists" : "null");

        if (!credentials?.username || !credentials?.password) {
          console.log("[AUTH] Missing username or password");
          return null;
        }

        console.log("[AUTH] Looking up user:", credentials.username);

        try {
          const user = await db.user.findUnique({
            where: { username: credentials.username },
          });

          if (!user) {
            console.log("[AUTH] User not found:", credentials.username);
            return null;
          }

          console.log("[AUTH] User found:", user.username, user.email);

          const isValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isValid) {
            console.log("[AUTH] Password mismatch");
            return null;
          }

          console.log("[AUTH] Password valid");

          // Get creator separately to avoid rewardScheme issue
          const creator = await db.$queryRawUnsafe<any[]>(
            `SELECT id FROM "Creator" WHERE userId = ? LIMIT 1`,
            user.id
          );

          console.log("[AUTH] Creator found:", creator?.[0]?.id ? "yes" : "no");

          const result = {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            creatorId: creator?.[0]?.id ?? undefined,
          };

          console.log("[AUTH] Authorization successful, returning:", result);
          return result;
        } catch (error: any) {
          console.error("[AUTH] Exception in authorize():", error.message);
          console.error("[AUTH] Full error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.email = user.email;
        token.role = user.role;
        token.creatorId = user.creatorId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        email: token.email as string,
        username: token.username as string,
        role: token.role as string,
        creatorId: token.creatorId as string | undefined,
      };
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
