import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import type { FetcherResponse } from "~/lib/types";

export function DeactivateTeamLeader({
	teamLeaderId,
}: {
	teamLeaderId: string;
}) {
	const fetcher = useFetcher<FetcherResponse>();
	const isSubmitting = fetcher.state === "submitting";
	return (
		<fetcher.Form
			method="POST"
			action="/resource/team-leaders"
			className="flex items-center gap-2"
			onSubmit={(e) => {
				e.preventDefault();
				fetcher.submit(
					{ teamLeaderId, intent: "deactivate-team-leader" },
					{
						method: "POST",
						action: "/resource/team-leaders",
					},
				);
			}}
		>
			<Button
				type="submit"
				disabled={isSubmitting}
				variant="ghost"
				className="cursor-pointer"
			>
				{isSubmitting ? "Deactivating..." : "Deactivate"}
			</Button>
		</fetcher.Form>
	);
}
