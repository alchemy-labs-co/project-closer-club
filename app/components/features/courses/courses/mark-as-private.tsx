import { Loader2 } from "lucide-react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import type { FetcherResponse } from "~/lib/types";

export function MarkAsPrivate({ courseId }: { courseId: string }) {
	const fetcher = useFetcher<FetcherResponse>();
	const isSubmitting = fetcher.state !== "idle";

	return (
		<fetcher.Form
			method="post"
			action="/resource/course"
			onSubmit={(e) => {
				e.preventDefault();
				fetcher.submit(
					{
						courseId,
						intent: "make-private",
					},
					{
						method: "post",
						action: "/resource/course",
					},
				);
			}}
		>
			<Button
				type="submit"
				variant="outline"
				className="cursor-pointer"
				disabled={isSubmitting}
			>
				{isSubmitting ? (
					<Loader2 className="w-4 h-4 animate-spin" />
				) : (
					"Make Private"
				)}
			</Button>
		</fetcher.Form>
	);
}
