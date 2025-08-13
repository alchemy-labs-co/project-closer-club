import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { data, redirect } from "react-router";
import { useFetcher } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { isAdminLoggedIn } from "~/lib/auth/auth.server";
import { migrateExistingVideos } from "~/scripts/migrate-videos.server";
import type { Route } from "./+types/admin.migrate-videos";

export async function loader({ request }: Route.LoaderArgs) {
	const { isLoggedIn, admin } = await isAdminLoggedIn(request);

	if (!isLoggedIn || !admin) {
		throw redirect("/admin/login");
	}

	return data({ admin });
}

export async function action({ request }: Route.ActionArgs) {
	const { isLoggedIn, admin } = await isAdminLoggedIn(request);

	if (!isLoggedIn || !admin) {
		return data({ success: false, message: "Unauthorized" }, { status: 401 });
	}

	try {
		// Run the migration
		await migrateExistingVideos();

		return data({
			success: true,
			message:
				"Video migration completed successfully. Check the console logs for details.",
		});
	} catch (error) {
		console.error("Migration error:", error);
		return data(
			{
				success: false,
				message: error instanceof Error ? error.message : "Migration failed",
			},
			{ status: 500 },
		);
	}
}

export default function MigrateVideosPage() {
	const fetcher = useFetcher<typeof action>();
	const [hasRun, setHasRun] = useState(false);
	const isLoading = fetcher.state === "submitting";

	const handleMigration = () => {
		if (
			confirm(
				"This will migrate all existing videos to the video library. This action cannot be undone. Continue?",
			)
		) {
			fetcher.submit({}, { method: "POST" });
			setHasRun(true);
		}
	};

	return (
		<div className="container mx-auto py-8 max-w-2xl">
			<Card>
				<CardHeader>
					<CardTitle>Video Library Migration</CardTitle>
					<CardDescription>
						Migrate existing lesson videos to the centralized video library
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>What this migration does:</AlertTitle>
						<AlertDescription className="space-y-2 mt-2">
							<ul className="list-disc list-inside space-y-1">
								<li>
									Finds all lessons with videos that aren't in the video library
								</li>
								<li>Creates video library records for each orphan video</li>
								<li>
									Links lessons to their corresponding video library entries
								</li>
								<li>Fetches metadata from Bunny CDN when available</li>
								<li>Preserves all existing functionality</li>
							</ul>
						</AlertDescription>
					</Alert>

					{fetcher.data?.success && (
						<Alert className="border-green-500 bg-green-50">
							<CheckCircle className="h-4 w-4 text-green-600" />
							<AlertTitle className="text-green-800">
								Migration Successful
							</AlertTitle>
							<AlertDescription className="text-green-700">
								{fetcher.data.message}
							</AlertDescription>
						</Alert>
					)}

					{fetcher.data?.success === false && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Migration Failed</AlertTitle>
							<AlertDescription>{fetcher.data.message}</AlertDescription>
						</Alert>
					)}

					<div className="flex justify-center">
						<Button
							onClick={handleMigration}
							disabled={isLoading || hasRun}
							size="lg"
							className="min-w-[200px]"
						>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Running Migration...
								</>
							) : hasRun ? (
								"Migration Complete"
							) : (
								"Start Migration"
							)}
						</Button>
					</div>

					<Alert variant="default" className="bg-blue-50 border-blue-200">
						<AlertCircle className="h-4 w-4 text-blue-600" />
						<AlertTitle className="text-blue-800">Note</AlertTitle>
						<AlertDescription className="text-blue-700">
							This migration is safe to run multiple times. It will skip videos
							that have already been migrated.
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		</div>
	);
}
