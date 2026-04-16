import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // Check if user exists
          const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email!))
            .limit(1);

          if (existingUser.length === 0) {
            // Create new user
            const nameParts = user.name?.split(" ") || ["", ""];
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ") || "";

            // Generate a unique placeholder phone for OAuth users
            const placeholderPhone = `oauth_${Date.now()}`;

            await db.insert(users).values({
              email: user.email!,
              firstName,
              lastName,
              passwordHash: "", // No password for OAuth users
              phone: placeholderPhone,
              signupFeePaid: false,
              emailVerified: true, // Google emails are verified
            });
          }
          return true;
        } catch (error) {
          console.error("Error during Google sign in:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && user) {
        // Get user from database
        const dbUser = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email!))
          .limit(1);

        if (dbUser.length > 0) {
          token.userId = dbUser[0].id;
          token.signupFeePaid = dbUser[0].signupFeePaid;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId;
        (session.user as any).signupFeePaid = token.signupFeePaid;

        // Create a JWT token for API compatibility
        const apiToken = jwt.sign(
          { userId: token.userId, email: session.user.email },
          process.env.JWT_SECRET || "your-secret-key",
          { expiresIn: "7d" }
        );
        (session as any).apiToken = apiToken;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Check if user needs to pay signup fee
      if (url.includes("/api/auth/callback")) {
        return `${baseUrl}/auth/callback`;
      }
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };
