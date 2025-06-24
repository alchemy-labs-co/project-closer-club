import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import type { FetcherResponse } from "~/lib/types";

export function MarkAsPublic({ courseId }: { courseId: string }) {
	const fetcher = useFetcher<FetcherResponse>();
	const isSubmitting = fetcher.state !== "idle";
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
		<fetcher.Form
			method="post"
			action="/resource/course"
			onSubmit={(e) => {
				e.preventDefault();
				fetcher.submit(
					{
						courseId,
						intent: "make-public",
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
					"Make Public"
				)}
			</Button>
		</fetcher.Form>
	);
}
