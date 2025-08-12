import { DownloadIcon, FileIcon } from "lucide-react";
import React, { Suspense } from "react";
import { redirect, useNavigation, useRouteLoaderData } from "react-router";
import { VideoPlayer } from "~/components/features/video-players/video-player";
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { dashboardConfig } from "~/config/dashboard";
import type { Attachment } from "~/db/schema";
import { isTeamLeaderLoggedIn } from "~/lib/auth/auth.server";
import { getAttachmentsForLessonForTeamLeader } from "~/lib/team-leaders/data-access/attachments.server";
import { getCourseBySlugForTeamLeader } from "~/lib/team-leaders/data-access/courses.server";
import { getLessonBySlugForTeamLeader } from "~/lib/team-leaders/data-access/lessons.server";
import type { Route } from "./+types/_team._editor.team.courses_.$courseSlug_.$moduleSlug_.$lessonSlug";

export async function loader({ request, params }: Route.LoaderArgs) {
	const { isLoggedIn, teamLeader } = await isTeamLeaderLoggedIn(request);

	if (!isLoggedIn || !teamLeader) {
		throw redirect("/team-leader/login");
	}

	const { courseSlug, moduleSlug, lessonSlug } = params;

	if (!courseSlug || !moduleSlug || !lessonSlug) {
		throw redirect("/team/courses");
	}

	// Verify team leader has access to this course
	const { course } = await getCourseBySlugForTeamLeader(request, courseSlug);
	if (!course) {
		throw redirect("/team/courses");
	}

	// Get lesson data
	const { lesson } = await getLessonBySlugForTeamLeader(
		request,
		moduleSlug,
		lessonSlug,
		courseSlug,
	);

	if (!lesson) {
		throw redirect("/team/courses");
	}

	// Get attachments as non-critical data
	const attachmentsPromise = getAttachmentsForLessonForTeamLeader(
		request,
		lesson.id,
	);

	return {
		lesson,
		attachmentsPromise,
		teamLeaderId: teamLeader.id,
		teamLeaderName: teamLeader.name,
		courseSlug,
		moduleSlug,
		lessonSlug,
	};
}

function useLessonLoaderData() {
	const data = useRouteLoaderData<typeof loader>(
		"routes/_team._editor.team.courses_.$courseSlug_.$moduleSlug_.$lessonSlug",
	);
	if (!data) {
		throw new Error("TeamLeaderLesson must be used within _team._editor route");
	}

	return data;
}

export default function TeamLeaderEditorLesson() {
	const navigation = useNavigation();

	const isNavigating = navigation.state !== "idle";

	// Show loading state when navigating between lessons
	if (isNavigating) {
		return (
			<div className="flex flex-col gap-8">
				<Skeleton className="w-full h-[400px] rounded-lg" />
				<div className="space-y-4">
					<Skeleton className="w-full h-[40px]" />
					<Skeleton className="w-full h-[200px]" />
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-8">
			<VideoContent />
			<VideoContentTabs />
		</div>
	);
}

function VideoContent() {
	const { lesson } = useLessonLoaderData();

	return (
		<VideoPlayer type={dashboardConfig.videoPlayer} url={lesson.videoUrl} />
	);
}

function VideoContentTabs() {
	const { lesson } = useLessonLoaderData();

	return (
		<Tabs defaultValue="overview" className="flex flex-col gap-6 w-full">
			<TabsList className="w-full">
				<TabsTrigger value="overview">Overview</TabsTrigger>
				<TabsTrigger value="resources">Resources</TabsTrigger>
			</TabsList>
			<TabsContent value="overview">
				<div className="space-y-4">
					<h2 className="text-2xl font-bold text-gray-800">{lesson.name}</h2>
					{lesson.description && (
						<div className="prose prose-gray text-balance">
							<p className="text-gray-600 leading-relaxed">
								{lesson.description}
							</p>
						</div>
					)}
				</div>
			</TabsContent>
			<TabsContent value="resources">
				<Suspense fallback={<Skeleton className="w-full h-[200px]" />}>
					<ResourcesContent />
				</Suspense>
			</TabsContent>
		</Tabs>
	);
}

function ResourcesContent() {
	const { attachmentsPromise } = useLessonLoaderData();
	const { attachments } = React.use(attachmentsPromise);

	const hasAttachments = attachments !== null;

	if (!hasAttachments) {
		return (
			<div className="text-center py-8">
				<FileIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
				<p className="text-gray-500">No resources available for this lesson.</p>
			</div>
		);
	}

	return (
		<div className="grid gap-3">
			{attachments.map((attachment) => (
				<AttachmentItem key={attachment.id} attachment={attachment} />
			))}
		</div>
	);
}

function AttachmentItem({
	attachment,
}: {
	attachment: Attachment;
}) {
	const handleDownload = () => {
		window.open(attachment.fileUrl, "_blank");
	};

	const getFileIcon = (extension: string) => {
		const ext = extension.toLowerCase();
		if (ext === "pdf") return "📄";
		if (ext === "doc" || ext === "docx") return "📝";
		if (ext === "png" || ext === "jpg" || ext === "jpeg") return "🖼️";
		return "📎";
	};

	return (
		<div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">
			<div className="flex items-center gap-3">
				<span className="text-2xl" role="img" aria-label="file">
					{getFileIcon(attachment.fileExtension)}
				</span>
				<div>
					<p className="font-medium text-gray-800">{attachment.fileName}</p>
					<p className="text-sm text-gray-500 capitalize">
						{attachment.fileExtension.toUpperCase()} file
					</p>
				</div>
			</div>
			<button
				type="button"
				onClick={handleDownload}
				className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
			>
				<DownloadIcon className="w-4 h-4" />
				Download
			</button>
		</div>
	);
}
