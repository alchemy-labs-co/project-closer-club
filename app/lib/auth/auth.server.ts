import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { data } from "react-router";
import db from "~/db/index.server";
import { account, session, user, verification } from "~/db/schema";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user,
			session,
			account,
			verification,
		},
	}),

	emailAndPassword: {
		enabled: true,
	},


	plugins: [admin()],
	user: {
		changeEmail: {
			enabled: true,
		},
		additionalFields: {
			role: {
				type: "string",
				required: true,
				defaultValue: "user",
				input: true,
			},
			phone: {
				type: "string",
				required: false,
				input: true,
			},
		},
	},
});

// auth-utils
export async function isAuthenticated(request: Request) {
	const session = await auth.api.getSession({
		headers: request.headers,
	});
	if (!session)
		return {
			session: null,
		};

	return { session: session.user };
}

export async function isAdminLoggedIn(request: Request) {
	const { session } = await isAuthenticated(request);
	if (!session)
		return {
			isLoggedIn: false,
			admin: null,
		};
	const isAdminLoggedIn = session.role === "admin";
	return {
		isLoggedIn: isAdminLoggedIn,
		admin: session,
	};
}

export async function isAgentLoggedIn(request: Request) {
	const { session } = await isAuthenticated(request);
	if (!session)
		return {
			isLoggedIn: false,
			student: null,
		};
	const isAgentLoggedIn = session.role === "user";

	return {
		isLoggedIn: isAgentLoggedIn,
		student: session,
	};
}

export async function isTeamLeaderLoggedIn(request: Request) {
	const { session } = await isAuthenticated(request);
	if (!session)
		return {
			isLoggedIn: false,
			teamLeader: null,
		};
	const isTeamLeaderLoggedIn = session.role === "team_leader";
	return {
		isLoggedIn: isTeamLeaderLoggedIn,
		teamLeader: session,
	};
}

export async function handleSignOut(request: Request) {
	const { response, headers } = await auth.api.signOut({
		returnHeaders: true,
		headers: request.headers,
	});
	if (!response.success) {
		return {
			success: false,
			message: "Failed to sign out",
		};
	}
	return data(
		{
			success: true,
			message: "Signed out successfully",
		},
		{ headers },
	);
}
