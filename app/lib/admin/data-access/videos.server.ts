import { eq, desc, asc, like, and, or, sql } from "drizzle-orm";
import db from "~/db/index.server";
import { videosTable, lessonsTable } from "~/db/schema";
import { isAdminLoggedIn } from "~/lib/auth/auth.server";
import type { SearchVideosSchema } from "~/lib/zod-schemas/video";

export async function getAllVideos(
	request: Request,
	filters?: SearchVideosSchema,
) {
	try {
		const { isLoggedIn } = await isAdminLoggedIn(request);
		if (!isLoggedIn) {
			return { success: false, message: "Unauthorized" };
		}

		const page = filters?.page || 1;
		const limit = filters?.limit || 20;
		const offset = (page - 1) * limit;

		// Build query conditions
		const conditions = [];

		if (filters?.query) {
			conditions.push(
				or(
					like(videosTable.title, `%${filters.query}%`),
					like(videosTable.description, `%${filters.query}%`),
					like(videosTable.tags, `%${filters.query}%`),
				),
			);
		}

		if (filters?.status && filters.status !== "all") {
			conditions.push(eq(videosTable.status, filters.status));
		}

		if (filters?.tags) {
			conditions.push(like(videosTable.tags, `%${filters.tags}%`));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Get total count
		const [{ count }] = await db
			.select({ count: sql<number>`count(*)` })
			.from(videosTable)
			.where(whereClause);

		// Get videos with pagination
		const videos = await db
			.select()
			.from(videosTable)
			.where(whereClause)
			.orderBy(desc(videosTable.createdAt))
			.limit(limit)
			.offset(offset);

		return {
			success: true,
			videos,
			pagination: {
				page,
				limit,
				total: Number(count),
				totalPages: Math.ceil(Number(count) / limit),
			},
		};
	} catch (error) {
		console.error("Error fetching videos:", error);
		return { success: false, message: "Failed to fetch videos" };
	}
}

export async function getVideoById(request: Request, videoId: string) {
	try {
		const { isLoggedIn } = await isAdminLoggedIn(request);
		if (!isLoggedIn) {
			return { success: false, message: "Unauthorized" };
		}

		const [video] = await db
			.select()
			.from(videosTable)
			.where(eq(videosTable.id, videoId));

		if (!video) {
			return { success: false, message: "Video not found" };
		}

		// Get usage count (lessons using this video)
		const [{ usageCount }] = await db
			.select({ usageCount: sql<number>`count(*)` })
			.from(lessonsTable)
			.where(eq(lessonsTable.videoId, videoId));

		// Get actual lessons using this video
		const lessons = await db
			.select({
				id: lessonsTable.id,
				name: lessonsTable.name,
				slug: lessonsTable.slug,
			})
			.from(lessonsTable)
			.where(eq(lessonsTable.videoId, videoId));

		return {
			success: true,
			video: {
				...video,
				usageCount: Number(usageCount),
				usedInLessons: lessons,
			},
		};
	} catch (error) {
		console.error("Error fetching video:", error);
		return { success: false, message: "Failed to fetch video" };
	}
}

export async function searchVideos(request: Request, query: string) {
	try {
		const { isLoggedIn } = await isAdminLoggedIn(request);
		if (!isLoggedIn) {
			return { success: false, message: "Unauthorized" };
		}

		const videos = await db
			.select()
			.from(videosTable)
			.where(
				and(
					or(
						like(videosTable.title, `%${query}%`),
						like(videosTable.description, `%${query}%`),
						like(videosTable.tags, `%${query}%`),
					),
					eq(videosTable.status, "ready"), // Only search ready videos
				),
			)
			.orderBy(desc(videosTable.createdAt))
			.limit(50);

		return { success: true, videos };
	} catch (error) {
		console.error("Error searching videos:", error);
		return { success: false, message: "Failed to search videos" };
	}
}

export async function getVideoUsage(request: Request, videoId: string) {
	try {
		const { isLoggedIn } = await isAdminLoggedIn(request);
		if (!isLoggedIn) {
			return { success: false, message: "Unauthorized" };
		}

		const lessons = await db
			.select({
				id: lessonsTable.id,
				name: lessonsTable.name,
				slug: lessonsTable.slug,
				moduleId: lessonsTable.moduleId,
			})
			.from(lessonsTable)
			.where(eq(lessonsTable.videoId, videoId));

		return { success: true, lessons, count: lessons.length };
	} catch (error) {
		console.error("Error fetching video usage:", error);
		return { success: false, message: "Failed to fetch video usage" };
	}
}

export async function getRecentVideos(request: Request, limit = 10) {
	try {
		const { isLoggedIn } = await isAdminLoggedIn(request);
		if (!isLoggedIn) {
			return { success: false, message: "Unauthorized" };
		}

		const videos = await db
			.select()
			.from(videosTable)
			.where(eq(videosTable.status, "ready"))
			.orderBy(desc(videosTable.createdAt))
			.limit(limit);

		return { success: true, videos };
	} catch (error) {
		console.error("Error fetching recent videos:", error);
		return { success: false, message: "Failed to fetch recent videos" };
	}
}

export async function getVideosByStatus(request: Request, status: string) {
	try {
		const { isLoggedIn } = await isAdminLoggedIn(request);
		if (!isLoggedIn) {
			return { success: false, message: "Unauthorized" };
		}

		const videos = await db
			.select()
			.from(videosTable)
			.where(eq(videosTable.status, status))
			.orderBy(desc(videosTable.createdAt));

		return { success: true, videos };
	} catch (error) {
		console.error("Error fetching videos by status:", error);
		return { success: false, message: "Failed to fetch videos" };
	}
}

export async function getVideoStats(request: Request) {
	try {
		const { isLoggedIn } = await isAdminLoggedIn(request);
		if (!isLoggedIn) {
			return { success: false, message: "Unauthorized" };
		}

		const [stats] = await db
			.select({
				total: sql<number>`count(*)`,
				ready: sql<number>`count(*) filter (where status = 'ready')`,
				processing: sql<number>`count(*) filter (where status = 'processing')`,
				failed: sql<number>`count(*) filter (where status = 'failed')`,
				totalSize: sql<number>`sum(file_size)`,
				totalDuration: sql<number>`sum(duration)`,
			})
			.from(videosTable);

		return {
			success: true,
			stats: {
				total: Number(stats.total),
				ready: Number(stats.ready),
				processing: Number(stats.processing),
				failed: Number(stats.failed),
				totalSize: Number(stats.totalSize || 0),
				totalDuration: Number(stats.totalDuration || 0),
			},
		};
	} catch (error) {
		console.error("Error fetching video stats:", error);
		return { success: false, message: "Failed to fetch video stats" };
	}
}
