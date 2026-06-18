/**
 * Better Auth configuration for The Banana Protocol.
 *
 * Verified import paths (live-probed against node_modules/better-auth 1.6.19):
 *   betterAuth        → "better-auth"          (re-exports from @better-auth/core)
 *   drizzleAdapter    → "better-auth/adapters/drizzle"
 *   organization      → "better-auth/plugins/organization"
 *
 * NOTE: better-auth 1.6.19 ships NO passkey plugin in dist/plugins/ (the directory
 * listing confirmed: anonymous, bearer, captcha, email-otp, generic-oauth, jwt,
 * magic-link, multi-session, oidc-provider, organization, two-factor, username, siwe
 * — no passkey entry). The passkey table exists in schema.ts for future use once the
 * plugin ships or is built on native WebAuthn (see docs/HANDOFF.md Decision §2).
 * emailAndPassword is a first-class option on betterAuth, not a plugin.
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins/organization";
import { db } from "../db/index.js";

export const auth = betterAuth({
  secret: process.env["BETTER_AUTH_SECRET"] ?? "banana-protocol-dev-secret-change-in-prod",
  baseURL: process.env["BETTER_AUTH_URL"] ?? "http://localhost:3000",

  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  emailAndPassword: {
    enabled: true,
  },

  plugins: [
    organization(),
  ],
});

export type Auth = typeof auth;
