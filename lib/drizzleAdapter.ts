import { 
	Adapter, 
	AdapterUser, 
	AdapterAccount, 
	AdapterSession, 
	VerificationToken 
} from "next-auth/adapters";

import { 
	eq, 
	InferSelectModel 
} from "drizzle-orm";

import { db } from "../db/drizzle";
import {users, accounts, sessions, verificationTokens} from "../db/schema"

type User = InferSelectModel<typeof users>;
type Session = InferSelectModel<typeof sessions>;

export const DrizzleAdapter = (): Adapter => ({
	async createUser(user: User): Promise<AdapterUser> {
		const [createdUser] = await db
			.insert(users)
			.values({
				email: user.email,
				name: user.name,
				emailVerified: user.emailVerified ?? null,
				image: user.image ?? null,
			})
			.returning();

		return { ...createdUser, id: String(createdUser.id)};
	},

	async getUser(id: string): Promise<AdapterUser | null> {
		const userList = await db
			.select()
			.from(users)
			.where(eq(users.id, Number(id)));
		const user = userList[0] ?? null;

		if (!user) return null;

		return { ...user, id: String(user.id) }; 
	},

	async getUserByEmail(email: string): Promise<AdapterUser | null> {
		const userList = await db
			.select()
			.from(users)
			.where(eq(users.email, email));
		const user = userList[0] ?? null;

		if (!user) return null;

		return { ...user, id: String(user.id)};
	},

	async getUserByAccount({ provider, providerAccountId }: { provider: string; providerAccountId: string }): Promise<AdapterUser | null> {
		const accountList = await db
		.select()
		.from(accounts)
		.where(eq(accounts.provider, provider) && (eq(accounts.providerAccountId, providerAccountId)));
		const account = accountList[0] ?? null;

		if (!account) return null;

		const userList = await db
			.select()
			.from(users)
			.where(eq(users.id, account.userId))
		const user = userList[0] ?? null;

		if (!user) return null;

		return { ...user, id: String(user.id)}
	},

	async updateUser(user: Partial<AdapterUser> & { id: string }): Promise<AdapterUser> {
		const id = Number(user.id); 
		const dataToUpdate: Partial<User> = {};

		if (user.name != undefined) dataToUpdate.name = user.name;
		if (user.email != undefined) dataToUpdate.email = user.email;
		if (user.image != undefined) dataToUpdate.image = user.image;
		if (user.emailVerified !== undefined) dataToUpdate.emailVerified = user.emailVerified;

		const updatedUserList = await db
			.update(users)
			.set(dataToUpdate)
			.where(eq(users.id, id))
			.returning();

		const updatedUser = updatedUserList[0];

		return { ...updatedUser, id:String(user.id)};
	},

	async deleteUser(id: string): Promise<void> {
		await db
			.delete(users)
			.where(eq(users.id, Number(id)));
	},

	async linkAccount(account: AdapterAccount): Promise<void> {
		await db.insert(accounts).values({
			userId: Number(account.userId), 
			provider: account.provider,
			providerAccountId: account.providerAccountId,
			type: account.type,
			access_token: account.access_token ?? null,
			refresh_token: account.refresh_token ?? null,
			expires_at: account.expires_at
			? new Date(account.expires_at * 1000)
			: null, 
			token_type: account.token_type ?? null,
			scope: account.scope ?? null,
			id_token: account.id_token ?? null,
		});
	},

	async unlinkAccount({ provider, providerAccountId }: { provider: string; providerAccountId: string }): Promise<void> {
		await db
			.delete(accounts)
			.where(eq(accounts.provider, provider) && eq(accounts.providerAccountId, providerAccountId))
		
	},

	async createSession(session: AdapterSession): Promise<AdapterSession> {
		const [createdSession] = await db
			.insert(sessions)
			.values({
				sessionToken: session.sessionToken,
				userId: Number(session.userId),
				expires: session.expires,
			})
			.returning();

		return { ...createdSession, userId: String(createdSession.userId)};
	},

	async getSessionAndUser(sessionToken: string): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
		const sessionList = await db
			.select()
			.from(sessions)
			.where(eq(sessions.sessionToken, sessionToken));
		const session = sessionList[0] ?? null;

		if (!session) return null;

		const userList = await db
			.select()
			.from(users)
			.where(eq(users.id, session.userId));
		const user = userList[0] ?? null;

		return {
			session: { ...session, userId: String(session.userId)},
			user: { ...user, id: String(user.id)},
		}
	},

	async updateSession(session: Partial<AdapterSession> & Pick<AdapterSession, "sessionToken">): Promise<AdapterSession> {
		const dataToUpdate: Partial<Session> = {};

		if (session.expires != null) dataToUpdate.expires = session.expires;
  		if (session.userId != null) dataToUpdate.userId = Number(session.userId);

		const updatedSessionList = await db
			.update(sessions)
			.set(dataToUpdate)
			.where(eq(sessions.sessionToken, session.sessionToken))
			.returning();
		const updatedSession = updatedSessionList[0] ?? null;
		
		return { ...updatedSession, userId: String(updatedSession.userId) };
	},

	async deleteSession(sessionToken: string): Promise<void> {
		await db
			.delete(sessions)
			.where(eq(sessions.sessionToken, sessionToken));
	},

	async createVerificationToken(token: VerificationToken): Promise<VerificationToken> {
		const [createdToken] = await db
			.insert(verificationTokens)
			.values(token)
			.returning();

		return createdToken;
	},

	async useVerificationToken({ identifier, token }: { identifier: string; token: string }): Promise<VerificationToken | null> {
		const recordList = await db
			.select()
			.from(verificationTokens)
			.where(eq(verificationTokens.identifier, identifier) && eq(verificationTokens.token, token))
		const record = recordList[0] ?? null;

		if (!record) return null;

		await db
			.delete(verificationTokens)
			.where(eq(verificationTokens.identifier, identifier) && eq(verificationTokens.token, token))

		return record;
	},
});
