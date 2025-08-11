import { desc, eq, inArray } from "drizzle-orm";
import { data } from "react-router";
import db from "~/db/index.server";
import { session, user } from "~/db/schema";
import { auth } from "~/lib/auth/auth.server";
import { isStudentAccountActivated } from "~/lib/student/data-access/students.server";
import { loginSchema, adminLoginSchema } from "../../../zod-schemas/auth";

// Unified Login Handler
export async function handleUnifiedSignIn(
	request: Request,
	formData: FormData,
) {
	const loginData = {
		email: formData.get("email"),
		password: formData.get("password"),
	};

	const unvalidatedFields = loginSchema.safeParse(loginData);
	if (!unvalidatedFields.success) {
		return data({ success: false, message: "Invalid Fields" }, { status: 403 });
	}

	const validatedFields = unvalidatedFields.data;

	try {
		// Sign in the user
		const { response, headers } = await auth.api.signInEmail({
			returnHeaders: true,
			body: {
				email: validatedFields.email,
				password: validatedFields.password,
			},
		});

		// Get user details including role
		const [signedInUser] = await db
			.select()
			.from(user)
			.where(eq(user.id, response.user.id))
			.limit(1);

		// Check for student activation if user role
		if (signedInUser.role === "user") {
			const { isStudentActivated } = await isStudentAccountActivated(
				validatedFields.email,
			);
			if (!isStudentActivated) {
				return data(
					{
						success: false,
						message:
							"Your account is not activated. Please contact your administrator.",
					},
					{ status: 403 },
				);
			}
		}

		// Check for team leader activation if team_leader role
		if (signedInUser.role === "team_leader") {
			// Add team leader activation check if needed
			// For now, we'll proceed
		}

		// Clear old sessions
		const { success } = await LogUserOutOfAllSessionsExceptMostActiveOne(
			response.user.id,
		);
		if (!success) {
			throw new Error("Error logging out user from all sessions");
		}

		// Determine redirect URL based on role
		let redirectToUrl: string;
		switch (signedInUser.role) {
			case "admin":
				redirectToUrl = "/dashboard";
				break;
			case "team_leader":
				redirectToUrl = "/team/analytics";
				break;
			case "user":
				redirectToUrl = "/student/courses";
				break;
			default:
				redirectToUrl = "/";
		}

		return data(
			{
				success: true,
				message: `Welcome back!`,
				redirectToUrl,
			},
			{ headers },
		);
	} catch (error) {
		console.error(`🔴Error signing in: ${error}`);
		return data(
			{
				success: false,
				message:
					error instanceof Error ? error.message : "Invalid email or password",
			},
			{ status: 500 },
		);
	}
}

// Admin Login
export async function handleSignInAdmin(request: Request, formData: FormData) {
	const loginData = {
		email: formData.get("email"),
		password: formData.get("password"),
	};
	const unvalidatedFields = adminLoginSchema.safeParse(loginData);
	if (!unvalidatedFields.success)
		return data(
			{
				success: false,
				message: "Invalid Fields",
			},
			{
				status: 403,
			},
		);
	const validatedFields = unvalidatedFields.data;

	try {
		// [insert for first time admin creations]

		// await auth.api.signUpEmail({
		// 	returnHeaders: true,
		// 	body: {
		// 		email: validatedFields.email,
		// 		password: validatedFields.password,
		// 		role: "admin",
		// 		name: "Admin",
		// 	},
		// });

		const { response, headers } = await auth.api.signInEmail({
			returnHeaders: true,
			body: {
				email: validatedFields.email,
				password: validatedFields.password,
				callbackURL: `${process.env.BASE_URL}/dashboard`,
			},
		});

		const [signedInUser] = await db
			.select()
			.from(user)
			.where(eq(user.id, response.user.id))
			.limit(1);

		if (signedInUser.role !== "admin") {
			return data(
				{
					success: false,
					message: "Not Allowed",
					redirectTo: "/login",
				},
				{ status: 403 },
			);
		}

		return data(
			{
				success: true,
				message: "Admin logged in",
			},
			{
				headers,
			},
		);
	} catch (error) {
		console.error(`🔴Error signing in admin: ${error}`);
		return data(
			{
				success: false,
				message:
					error instanceof Error
						? error.message
						: "Something went wrong signing in, try again later",
			},
			{
				status: 500,
			},
		);
	}
}
// Student Login (role:student)
export async function handleSignInStudent(
	request: Request,
	formData: FormData,
) {
	const loginData = {
		email: formData.get("email"),
		password: formData.get("password"),
	};
	const unvalidatedFields = loginSchema.safeParse(loginData);
	if (!unvalidatedFields.success)
		return data(
			{
				success: false,
				message: "Invalid Fields",
			},
			{
				status: 403,
			},
		);
	const validatedFields = unvalidatedFields.data;

	try {
		const { response, headers } = await auth.api.signInEmail({
			returnHeaders: true,
			body: {
				email: validatedFields.email,
				password: validatedFields.password,
				callbackURL: `${process.env.BASE_URL}/student/courses`,
			},
		});

		const [signedInUser] = await db
			.select()
			.from(user)
			.where(eq(user.id, response.user.id))
			.limit(1);

		if (signedInUser.role === "admin") {
			return data(
				{
					success: false,
					message: "Not Allowed",
					redirectTo: "/admin/login",
				},
				{ status: 403 },
			);
		}

		const { isStudentActivated } = await isStudentAccountActivated(
			validatedFields.email,
		);

		if (!isStudentActivated) {
			return data(
				{
					success: false,
					message: "Student account is not activated contact your admin",
				},
				{
					status: 403,
				},
			);
		}

		const { success } = await LogUserOutOfAllSessionsExceptMostActiveOne(
			response.user.id,
		);
		if (!success) {
			throw new Error("Error logging out user from all sessions");
		}
		return data(
			{
				success: true,
				message: "Student logged in",
			},
			{
				headers,
			},
		);
	} catch (error) {
		console.error(`🔴Error signing in student: ${error}`);
		return data(
			{
				success: false,
				message:
					error instanceof Error
						? error.message
						: "Something went wrong signing in, try again later",
			},
			{
				status: 500,
			},
		);
	}
}
// Team Leader Login (role:team_leader)
export async function handleSignInTeamLeader(
	request: Request,
	formData: FormData,
) {
	const loginData = {
		email: formData.get("email"),
		password: formData.get("password"),
	};
	const unvalidatedFields = loginSchema.safeParse(loginData);
	if (!unvalidatedFields.success)
		return data(
			{
				success: false,
				message: "Invalid Fields",
			},
			{
				status: 403,
			},
		);
	const validatedFields = unvalidatedFields.data;

	try {
		const { response, headers } = await auth.api.signInEmail({
			returnHeaders: true,
			body: {
				email: validatedFields.email,
				password: validatedFields.password,
				callbackURL: `${process.env.BASE_URL}/team`,
			},
		});

		const [signedInUser] = await db
			.select()
			.from(user)
			.where(eq(user.id, response.user.id))
			.limit(1);

		if (signedInUser.role !== "team_leader") {
			return data(
				{
					success: false,
					message: "Not Allowed",
					redirectTo: "/team-leader/login",
				},
				{ status: 403 },
			);
		}

		const { success } = await LogUserOutOfAllSessionsExceptMostActiveOne(
			response.user.id,
		);
		if (!success) {
			throw new Error("Error logging out user from all sessions");
		}

		return data(
			{
				success: true,
				message: "Team Leader logged in",
			},
			{
				headers,
			},
		);
	} catch (error) {
		console.error(`🔴Error signing in team leader: ${error}`);
		return data(
			{
				success: false,
				message:
					error instanceof Error
						? error.message
						: "Something went wrong signing in, try again later",
			},
			{
				status: 500,
			},
		);
	}
}
// Logout user from all sessions except the new one
export async function LogUserOutOfAllSessionsExceptMostActiveOne(
	userId: string,
) {
	try {
		const allExisitingSessionForLoggedInUser = await db
			.select()
			.from(session)
			.where(eq(session.userId, userId))
			.orderBy(desc(session.createdAt));
		const oldSessionsToDelete = allExisitingSessionForLoggedInUser.slice(1);

		if (oldSessionsToDelete.length > 0) {
			const sessionIdsToDelete = oldSessionsToDelete.map(
				(session) => session.id,
			);
			await db.delete(session).where(inArray(session.id, sessionIdsToDelete));
		}
		return {
			success: true,
		};
	} catch (error) {
		console.error("🔴Error logging out user from all sessions", error);
		return { success: false };
	}
}

export async function DeleteAllExistingAuthSessions(userId: string) {
	try {
		await db.delete(session).where(eq(session.userId, userId));
	} catch (error) {
		console.error(
			"🔴Error deleting all existing user auth sessions:",
			error instanceof Error ? error.message : error,
		);
		return data(
			{
				success: false,
				message:
					error instanceof Error ? error.message : "Something went wrong",
			},
			{
				status: 500,
			},
		);
	}
}
