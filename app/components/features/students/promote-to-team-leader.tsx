import { Loader2, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import type { FetcherResponse } from "~/lib/types";

interface PromoteToTeamLeaderProps {
	studentId: string;
	studentName?: string;
}

export function PromoteToTeamLeader({
	studentId,
	studentName,
}: PromoteToTeamLeaderProps) {
	const [open, setOpen] = useState(false);
	const fetcher = useFetcher<FetcherResponse>();
	const isPromoting = fetcher.state === "submitting";

	// Handle successful promotion
	useEffect(() => {
		if (fetcher.data?.success && fetcher.state === "idle" && open) {
			toast.success(
				`${studentName || "Agent"} successfully promoted to team leader`,
			);
			setOpen(false);
			// The user will need to re-login due to session invalidation
			setTimeout(() => {
				toast.info(
					"The promoted user will need to log in again to access team leader features",
				);
			}, 2000);
		}
	}, [fetcher.data, fetcher.state, open, studentName]);

	// Handle promotion error
	useEffect(() => {
		if (fetcher.data && !fetcher.data.success && fetcher.state === "idle") {
			toast.error(fetcher.data.message || "Failed to promote agent");
		}
	}, [fetcher.data, fetcher.state]);

	const handlePromote = () => {
		const formData = new FormData();
		formData.append("intent", "promote-to-team-leader");
		formData.append("studentId", studentId);

		fetcher.submit(formData, {
			method: "POST",
			action: "/resource/student",
		});
	};

	return (
		<>
			<Button
				variant="outline"
				size="sm"
				onClick={() => setOpen(true)}
				className="cursor-pointer"
			>
				<TrendingUp className="h-4 w-4 mr-1" />
				Promote to Team Leader
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Promote to Team Leader</DialogTitle>
						<DialogDescription className="space-y-3">
							<p>
								Are you sure you want to promote{" "}
								<strong>{studentName || "this agent"}</strong> to team leader?
							</p>

							<div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
								<p className="font-semibold text-amber-800 mb-2">
									This action will:
								</p>
								<ul className="list-disc list-inside space-y-1 text-amber-700">
									<li>Change their role from Agent to Team Leader</li>
									<li>Remove them from any team leader assignment</li>
									<li>Grant access to team management and analytics</li>
									<li>Force them to log in again with new permissions</li>
									<li>Allow them to manage other agents</li>
								</ul>
							</div>

							<div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
								<p className="font-semibold text-green-800 mb-2">
									What will be preserved:
								</p>
								<ul className="list-disc list-inside space-y-1 text-green-700">
									<li>All course progress and quiz completions</li>
									<li>Certificates and achievements</li>
									<li>Course enrollments (can still access as team leader)</li>
									<li>Account history and data</li>
								</ul>
							</div>

							<p className="text-red-600 font-semibold">
								⚠️ This action cannot be easily undone.
							</p>
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={isPromoting}
						>
							Cancel
						</Button>
						<Button
							variant="default"
							onClick={handlePromote}
							disabled={isPromoting}
						>
							{isPromoting ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Promoting...
								</>
							) : (
								<>
									<TrendingUp className="w-4 h-4 mr-2" />
									Promote to Team Leader
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
