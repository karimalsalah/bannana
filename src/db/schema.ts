import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

/**
 * Database schema for The Banana Protocol.
 *
 * Two layers live here:
 *  1. The Better Auth core tables (user / session / account / verification) plus
 *     the passkey and organization plugin tables. Better Auth owns their shape;
 *     we declare them so Drizzle migrations and the rest of the app are typed.
 *  2. The protocol's own tables: the on-chain banana NFTs, the $PEEL stakes that
 *     feed the code, and the append-only lifecycle event log (audit-ready by design).
 */

// ── Better Auth: core ────────────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  activeOrganizationId: text("active_organization_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Better Auth: passkey plugin (WebAuthn / biometric signer) ─────────────────

export const passkey = pgTable("passkey", {
  id: text("id").primaryKey(),
  name: text("name"),
  publicKey: text("public_key").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  credentialID: text("credential_id").notNull(),
  counter: integer("counter").notNull().default(0),
  deviceType: text("device_type").notNull(),
  backedUp: boolean("backed_up").notNull().default(false),
  transports: text("transports"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Better Auth: organization plugin ──────────────────────────────────────────

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const member = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const invitation = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role"),
  status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at").notNull(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

// ── The Banana Protocol: domain tables ────────────────────────────────────────

/** The evolutionary lifecycle the promo narrates, as a strict enum. */
export const lifecycleStage = pgEnum("lifecycle_stage", [
  "DORMANT",
  "CHARGING",
  "MUTATING",
  "CRITICAL",
  "ASCENDED",
]);

/** One minted banana per ERC-4337 smart account. Its ripeness IS its evolution. */
export const bananaNft = pgTable("banana_nft", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  /** ERC-4337 biometric Safe smart-account address. */
  smartAccountAddress: text("smart_account_address").notNull().unique(),
  tokenId: text("token_id"),
  stage: lifecycleStage("stage").notNull().default("DORMANT"),
  /** 0..1 — the uRipeness uniform, persisted. */
  ripeness: numeric("ripeness", { precision: 5, scale: 4 }).notNull().default("0"),
  /** Total $PEEL fed into the core, in wei (string to avoid bigint precision loss). */
  peelStakedWei: numeric("peel_staked_wei", { precision: 78, scale: 0 })
    .notNull()
    .default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Every gasless $PEEL stake that "feeds the code." Append-only. */
export const peelStake = pgTable("peel_stake", {
  id: text("id").primaryKey(),
  bananaId: text("banana_id")
    .notNull()
    .references(() => bananaNft.id, { onDelete: "cascade" }),
  amountWei: numeric("amount_wei", { precision: 78, scale: 0 }).notNull(),
  /** ERC-4337 UserOperation hash (gasless, paymaster-sponsored). */
  userOpHash: text("user_op_hash").notNull().unique(),
  sponsored: boolean("sponsored").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Append-only audit log of stage transitions — the dashboard's proof of truth. */
export const lifecycleEvent = pgTable("lifecycle_event", {
  id: text("id").primaryKey(),
  bananaId: text("banana_id")
    .notNull()
    .references(() => bananaNft.id, { onDelete: "cascade" }),
  fromStage: lifecycleStage("from_stage"),
  toStage: lifecycleStage("to_stage").notNull(),
  ripenessAt: numeric("ripeness_at", { precision: 5, scale: 4 }).notNull(),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof user.$inferSelect;
export type BananaNft = typeof bananaNft.$inferSelect;
export type NewBananaNft = typeof bananaNft.$inferInsert;
export type PeelStake = typeof peelStake.$inferSelect;
export type LifecycleEvent = typeof lifecycleEvent.$inferSelect;
export type Stage = (typeof lifecycleStage.enumValues)[number];
