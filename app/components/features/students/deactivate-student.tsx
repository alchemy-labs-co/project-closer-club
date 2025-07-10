import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import type { FetcherResponse } from "~/lib/types";

export function DeactivateStudent({ studentId }: { studentId: string }) {
	const fetcher = useFetcher<FetcherResponse>();
	const isSubmitting = fetcher.state === "submitting";
	return (
		<fetcher.Form
			method="POST"
			action="/resource/student"
			className="flex items-center gap-2"
			onSubmit={(e) => {
				e.preventDefault();
				fetcher.submit(
					{ studentId, intent: "deactivate-student" },
					{
						method: "POST",
						action: "/resource/student",
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
