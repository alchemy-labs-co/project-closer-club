import { eq } from "drizzle-orm";
import db from "./app/db/index.server";
import { user } from "./app/db/schema";
import { auth } from "./app/lib/auth/auth.server";

async function seed() {
	console.log("🌱 Starting seed script...");

	try {
		// Admin user details
		const adminEmail = process.env.ADMIN_EMAIL || "admin@closerclub.com";
		const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456";
		const adminName = process.env.ADMIN_NAME || "Admin User";

		// Check if admin user already exists
		const existingAdmin = await db
			.select()
			.from(user)
			.where(eq(user.email, adminEmail))
			.limit(1);

		if (existingAdmin.length > 0) {
			console.log("✅ Admin user already exists:", adminEmail);
			return;
		}

		// Create admin user using better-auth API
		const result = await auth.api.signUpEmail({
			body: {
				email: adminEmail,
				password: adminPassword,
				name: adminName,
				role: "admin",
			},
		});

		if (!result.user) {
			throw new Error("Failed to create admin user");
		}

		// Update the user to verify email and set admin role
		await db
			.update(user)
			.set({
				emailVerified: true,
				role: "admin",
			})
			.where(eq(user.id, result.user.id));

		console.log("✅ Admin user created successfully!");
		console.log("📧 Email:", adminEmail);
		console.log("🔑 Password:", adminPassword);
		console.log("\n⚠️  Please change the password after first login!");
	} catch (error) {
		console.error("❌ Error seeding database:", error);
		process.exit(1);
	}

	process.exit(0);
}

// Run the seed function
seed();
