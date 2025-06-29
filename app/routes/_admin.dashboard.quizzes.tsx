import { format } from "date-fns";
import { Loader2, PlusIcon } from "lucide-react";
import { useEffect } from "react";
import { data, Link, useFetcher, useLoaderData } from "react-router";
import { toast } from "sonner";
import PrimaryButton from "~/components/global/brand/primary-button";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { eq } from "drizzle-orm";
import db from "~/db/index.server";
import {
	quizzesTable,
	lessonsTable,
	modulesTable,
	coursesTable,
} from "~/db/schema";
import type { Route } from "./+types/_admin.dashboard.quizzes";

export async function loader({}: Route.LoaderArgs) {
	// Join quizzes with lessons, modules, and courses to get the necessary slugs for building lesson URLs
	const quizzesWithLessonInfo = await db
		.select({
			id: quizzesTable.id,
			lessonId: quizzesTable.lessonId,
			questions: quizzesTable.questions,
			createdAt: quizzesTable.createdAt,
			updatedAt: quizzesTable.updatedAt,
			lessonSlug: lessonsTable.slug,
			lessonName: lessonsTable.name,
			moduleSlug: modulesTable.slug,
			moduleName: modulesTable.name,
			courseSlug: coursesTable.slug,
			courseName: coursesTable.name,
		})
		.from(quizzesTable)
		.innerJoin(lessonsTable, eq(quizzesTable.lessonId, lessonsTable.id))
		.innerJoin(modulesTable, eq(lessonsTable.moduleId, modulesTable.id))
		.innerJoin(coursesTable, eq(modulesTable.courseId, coursesTable.id));

	return data({ quizzes: quizzesWithLessonInfo }, { status: 200 });
}

export default function QuizzesPage() {
	return (
		<div className="flex flex-col gap-8 md:gap-12 h-full overflow-y-auto py-4">
			<QuizzesList />
		</div>
	);
}

function QuizzesList() {
	const { quizzes } = useLoaderData<typeof loader>();

	if (quizzes.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center">
				<div className="mb-4 text-gray-400">
					<PlusIcon className="w-16 h-16 mx-auto" />
				</div>
				<h3 className="text-xl font-semibold text-gray-600 mb-2">
					No quizzes yet
				</h3>
				<p className="text-gray-500 mb-6">
					Create your first quiz to get started.
				</p>
				<CreateQuizCard />
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
			{quizzes.map((quiz) => (
				<QuizCard key={quiz.id} quiz={quiz} />
			))}
			<CreateQuizCard />
		</div>
	);
}

function QuizCard({
	quiz,
}: {
	quiz: {
		id: string;
		lessonId: string;
		questions: any;
		createdAt: Date;
		updatedAt: Date;
		lessonSlug: string;
		lessonName: string;
		moduleSlug: string;
		moduleName: string;
		courseSlug: string;
		courseName: string;
	};
}) {
	const {
		id,
		questions,
		createdAt,
		lessonSlug,
		moduleSlug,
		courseSlug,
		lessonName,
		moduleName,
		courseName,
	} = quiz;
	const parsedQuestions = Array.isArray(questions) ? questions : [];
	const questionCount = parsedQuestions.length;

	const lessonUrl = `/dashboard/courses/${courseSlug}/${moduleSlug}/${lessonSlug}`;

	return (
		<div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
			<div className="p-6">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2">
						<div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-primary/80 rounded-lg flex items-center justify-center">
							<span className="text-white font-semibold text-sm">
								{questionCount}
							</span>
						</div>
						<div>
							<h3 className="font-semibold text-gray-900">
								Quiz #{id.slice(-8)}
							</h3>
							<p className="text-sm text-gray-500">
								{questionCount} question{questionCount !== 1 ? "s" : ""}
							</p>
						</div>
					</div>
				</div>

				<div className="mb-4 space-y-1">
					<p className="text-sm text-gray-600">
						<span className="font-medium">Lesson:</span> {lessonName}
					</p>
					<p className="text-sm text-gray-600">
						<span className="font-medium">Module:</span> {moduleName}
					</p>
					<p className="text-sm text-gray-600">
						<span className="font-medium">Course:</span> {courseName}
					</p>
					<p className="text-sm text-gray-600">
						Created {format(new Date(createdAt), "MMM d, yyyy")}
					</p>
				</div>

				<div className="flex gap-2 cursor-pointer w-full">
					<Link to={lessonUrl} className="flex-1">
						<Button variant="outline" className="w-full">
							View Lesson
						</Button>
					</Link>
					<Link
						to={`/dashboard/quizzes/create?edit=${id}`}
						className="flex-1 w-full"
					>
						<PrimaryButton className="w-full">Edit Quiz</PrimaryButton>
					</Link>
					<DeleteQuiz quizId={id} />
				</div>
			</div>
		</div>
	);
}

function CreateQuizCard() {
	return (
		<Link to="/dashboard/quizzes/create" className="block h-full">
			<div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer h-full">
				<div className="p-6 h-full flex flex-col justify-center items-center">
					<div className="flex flex-col items-center gap-4">
						<div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
							<PlusIcon className="w-5 h-5 text-gray-600" />
						</div>
						<div className="text-center">
							<h3 className="font-semibold text-gray-900 mb-2">
								Create New Quiz
							</h3>
						</div>
					</div>
				</div>
			</div>
		</Link>
	);
}

function DeleteQuiz({ quizId }: { quizId: string }) {
	const fetcher = useFetcher();
	const isPending = fetcher.state !== "idle";
	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		fetcher.submit(
			{ quizId, intent: "delete-quiz" },
			{ method: "post", action: "/resource/quiz" }
		);
	};

	useEffect(() => {
		if (fetcher.data) {
			if (fetcher.data.success) {
				toast.success(fetcher.data.message);
			} else {
				toast.error(fetcher.data.message);
			}
		}
	}, [fetcher.data]);

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="destructive" className="flex-1">
					Delete
				</Button>
			</DialogTrigger>
			<DialogContent>
				<fetcher.Form
					method="post"
					action="/resource/quiz"
					onSubmit={handleSubmit}
				>
					<DialogHeader>
						<DialogTitle>Delete Quiz</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this quiz?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type="submit"
							variant="destructive"
							className="cursor-pointer"
							disabled={isPending}
						>
							{isPending ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								"Delete"
							)}
						</Button>
						<Button type="button" variant="outline" disabled={isPending}>
							Cancel
						</Button>
					</DialogFooter>
				</fetcher.Form>
			</DialogContent>
		</Dialog>
	);
}
