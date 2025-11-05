import { pgTable, serial, text, timestamp, varchar, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("email_verified"),
  image: text("image")
}, (t) => ({
  emailIdx: uniqueIndex("users_email_idx").on(t.email),
}));

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: timestamp("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
}, (t) => ({
  providerIdx: uniqueIndex("accounts_provider_idx").on(t.provider, t.providerAccountId)
}));

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionToken: varchar("session_token", { length: 255 }).notNull(),
  userId: serial("user_id").notNull(),
  expires: timestamp("expires").notNull(),
}, (t) => ({
  tokenIdx: uniqueIndex("sessions_session_token_idx").on(t.sessionToken)
}));

export const verificationTokens = pgTable("verification_tokens", {
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  expires: timestamp("expires").notNull(),
}, (t) => ({
  tokenIdx: uniqueIndex("verification_tokens_token_idx").on(t.token)
}));
