import { href, useNavigate } from "react-router";
import { DeleteDialog } from "~/components/global/admin/delete-dialog";
import { Button } from "~/components/ui/button";

export function DeleteSegment({
	segmentId,
	courseSlug,
}: { segmentId: string; courseSlug: string }) {
	const navigate = useNavigate();
	return (
		<DeleteDialog
			resourceRoute="/resource/segment"
			hiddenInputs={[
				{ name: "id", value: segmentId },
				{ name: "intent", value: "delete-segment" },
				{ name: "courseSlug", value: courseSlug },
			]}
			title="Delete Segment"
			description={
				<div className="text-sm text-gray-500">
					Are you sure you want to delete this segment?
					<br />
					This action cannot be undone.
				</div>
			}
			trigger={
				<Button
					type="button"
					variant="outline"
					className="cursor-pointer w-fit text-red-400 hover:text-red-500 self-center h-10"
				>
					Delete Segment
				</Button>
			}
			onSuccess={() => {
				// redirect to the course page
				navigate(href("/dashboard/courses/:slug", { slug: courseSlug }));
			}}
		/>
	);
}
