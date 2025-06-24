import { useEffect } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import type { FetcherResponse } from "~/lib/types";

export function DeleteTeamLeader({ teamLeaderId }: { teamLeaderId: string }) {
	const fetcher = useFetcher<FetcherResponse>();
	const isSubmitting = fetcher.state === "submitting";
	useEffect(() => {
		if (fetcher.data) {
			if (fetcher.data.success) {
				toast.success(fetcher.data.message);
			}
			if (!fetcher.data.success) {
				toast.error(fetcher.data.message);
			}
		}
	}, [fetcher.data]);
	return (
		<fetcher.Form
			method="POST"
			action="/resource/team-leaders"
			className="flex gap-2"
			onSubmit={(e) => {
				e.preventDefault();
				fetcher.submit(
					{ teamLeaderId, intent: "delete-team-leader" },
					{
						method: "POST",
						action: "/resource/team-leaders",
					}
				);
			}}
		>
			<Button
				type="submit"
				disabled={isSubmitting}
				variant="ghost"
				className="cursor-pointer hover:bg-white w-full text-red-400"
			>
				{isSubmitting ? "Deleting..." : "Delete"}
			</Button>
		</fetcher.Form>
	);
}
