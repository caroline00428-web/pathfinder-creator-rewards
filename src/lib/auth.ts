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
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // 使用 raw SQL（与正常工作的 debug 端点一致），避免 Prisma ORM + LibSQL adapter 的兼容问题
          const users = await db.$queryRawUnsafe<any[]>(
            `SELECT id, username, email, "passwordHash", role FROM "User" WHERE username = ?`,
            credentials.username
          );

          if (!users || users.length === 0) {
            return null;
          }

          const user = users[0];

          const isValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isValid) {
            return null;
          }

          // 获取关联的 Creator
          let creatorId: string | undefined;
          try {
            const creators = await db.$queryRawUnsafe<any[]>(
              `SELECT id FROM "Creator" WHERE "userId" = ? LIMIT 1`,
              user.id
            );
            creatorId = creators?.[0]?.id ?? undefined;
          } catch {
            // Creator 查询失败不阻塞登录
          }

          return {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            creatorId,
          };
        } catch {
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
