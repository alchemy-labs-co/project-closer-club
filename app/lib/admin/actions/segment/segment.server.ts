import { data } from "react-router";
import { and, eq } from "drizzle-orm";
import { redirect } from "react-router";
import db from "~/db/index.server";
import { lessonsTable, modulesTable } from "~/db/schema";
import { isAdminLoggedIn } from "~/lib/auth/auth.server";
import { titleToSlug } from "~/lib/utils";
import {
	createSegmentSchema,
	editSegmentSchema,
} from "../../../zod-schemas/segment";
import { getCourseBySlug } from "../../data-access/courses.server";
import { getModuleBySlug } from "../../data-access/modules/modules.server";
import { checkSegmentSlugUniqueForModule } from "../shared/shared.server";

export async function handleCreateSegment(
	request: Request,
	formData: FormData,
) {
	// auth check
	const { isLoggedIn } = await isAdminLoggedIn(request);

	if (!isLoggedIn) {
		throw redirect("/admin/login");
	}

	const unvalidatedFields = createSegmentSchema.safeParse(
		Object.fromEntries(formData),
	);

	if (!unvalidatedFields.success) {
		return data(
			{ success: false, message: "Invalid form data" },
			{ status: 400 },
		);
	}

	const { courseSlug, moduleSlug, name, description, videoUrl } = unvalidatedFields.data;

	try {
		// getting the module where the lesson will be created
		const { success: moduleResponse, module } = await getModuleBySlug(
			request,
			moduleSlug,
			courseSlug,
		);

		if (!moduleResponse || !module) {
			return data(
				{ success: false, message: "Module not found" },
				{ status: 404 },
			);
		}

		// convert lesson name to slug
		const slug = titleToSlug(name);

		// check the slug created is unique within this module
		const isSlugUnique = await checkSegmentSlugUniqueForModule(slug, module.id);
		if (!isSlugUnique) {
			return data(
				{ success: false, message: "a lesson with this name already exists in this module" },
				{ status: 400 },
			);
		}

		// Check if this is the first lesson in the first module of the course
		const isFirstLessonInFirstModule = await checkIfFirstLessonInFirstModule(module, courseSlug);

		// insert lesson into database
		const [insertedSegment] = await db
			.insert(lessonsTable)
			.values({
				name,
				description,
				videoUrl,
				slug,
				moduleId: module.id,
			})
			.returning({
				slug: lessonsTable.slug,
			});

		if (!insertedSegment) {
			return data(
				{ success: false, message: "Failed to create lesson" },
				{ status: 500 },
			);
		}

		return data(
			{
				success: true,
				message: "Lesson created successfully",
				segmentSlug: insertedSegment.slug,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error creating lesson:", error);
		return data(
			{
				success: false,
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}

// Legacy functions for backward compatibility - these need to be updated later
export async function handleEditSegment(request: Request, formData: FormData) {
	// auth check
	const { isLoggedIn } = await isAdminLoggedIn(request);

	if (!isLoggedIn) {
		throw redirect("/admin/login");
	}

	const unvalidatedFields = editSegmentSchema.safeParse(
		Object.fromEntries(formData),
	);

	if (!unvalidatedFields.success) {
		return data(
			{ success: false, message: "Invalid form data" },
			{ status: 400 },
		);
	}

	const { courseSlug, moduleSlug, segmentSlug, name, description, videoUrl } = unvalidatedFields.data;

	try {
		// getting the module where the lesson is being edited
		const { success: moduleResponse, module } = await getModuleBySlug(
			request,
			moduleSlug,
			courseSlug,
		);

		if (!moduleResponse || !module) {
			return data(
				{ success: false, message: "Module not found" },
				{ status: 404 },
			);
		}

		// check if the lesson exists in this module
		const existingLesson = module.lessons.find(lesson => lesson.slug === segmentSlug);
		if (!existingLesson) {
			return data(
				{ success: false, message: "Lesson not found" },
				{ status: 404 },
			);
		}

		// convert lesson name to slug
		const slug = titleToSlug(name);

		// check the slug created is unique within this module (unless it's the same as current)
		const isSlugUnique = await checkSegmentSlugUniqueForModule(slug, module.id, segmentSlug);
		if (!isSlugUnique) {
			return data(
				{ success: false, message: "a lesson with this name already exists in this module" },
				{ status: 400 },
			);
		}

		// update lesson in database
		const [updatedLesson] = await db
			.update(lessonsTable)
			.set({
				name,
				description,
				videoUrl,
				slug,
			})
			.where(
				and(
					eq(lessonsTable.slug, segmentSlug),
					eq(lessonsTable.moduleId, module.id),
				),
			)
			.returning({
				slug: lessonsTable.slug,
			});

		if (!updatedLesson) {
			return data(
				{ success: false, message: "Failed to update lesson" },
				{ status: 500 },
			);
		}

		return data(
			{
				success: true,
				message: "Lesson updated successfully",
				redirectTo: updatedLesson.slug,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error updating lesson:", error);
		return data(
			{
				success: false,
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}

export async function handleDeleteSegment(request: Request, formData: FormData) {
	const { isLoggedIn } = await isAdminLoggedIn(request);
	if (!isLoggedIn) {
		throw redirect("/admin/login");
	}

	const segmentId = formData.get("segmentId") as string;

	if (!segmentId) {
		return data(
			{ success: false, message: "Segment ID is required" },
			{ status: 400 },
		);
	}

	try {
		// With cascade deletes, we only need to delete the lesson
		// No related records need manual deletion
		await db
			.delete(lessonsTable)
			.where(eq(lessonsTable.id, segmentId));

		return data(
			{ success: true, message: "Lesson deleted successfully" },
			{ status: 200 },
		);
	} catch (error) {
		console.error("Delete segment error:", error);
		return data(
			{
				success: false,
				message:
					error instanceof Error ? error.message : "An unknown error occurred",
			},
			{ status: 500 },
		);
	}
}

export async function handleMakeSegmentPrivate(request: Request, formData: FormData) {
	return data(
		{ success: false, message: "Private/public functionality has been removed for lessons" },
		{ status: 400 },
	);
}

export async function handleMakeSegmentPublic(request: Request, formData: FormData) {
	return data(
		{ success: false, message: "Private/public functionality has been removed for lessons" },
		{ status: 400 },
	);
}

// Helper function no longer needed but keeping for compatibility
async function checkIfFirstLessonInFirstModule(module: any, courseSlug: string): Promise<boolean> {
	return false; // Always return false since we no longer use this logic
}
