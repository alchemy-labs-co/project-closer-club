import { useEffect } from "react";
import { useFetcher } from "react-router";
import { Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { toast } from "sonner";
import type { FetcherResponse } from "~/lib/types";

interface DeleteVideoDialogProps {
	video: {
		id: string;
		title: string;
	};
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDeleteSuccess?: () => void;
}

export function DeleteVideoDialog({
	video,
	open,
	onOpenChange,
	onDeleteSuccess,
}: DeleteVideoDialogProps) {
	const fetcher = useFetcher<FetcherResponse>();
	const isDeleting = fetcher.state === "submitting";

	// Handle successful deletion
	useEffect(() => {
		if (fetcher.data?.success && fetcher.state === "idle" && open) {
			toast.success(`Video "${video.title}" deleted successfully`);
			onDeleteSuccess?.();
			onOpenChange(false);
		}
	}, [
		fetcher.data,
		fetcher.state,
		open,
		video.title,
		onDeleteSuccess,
		onOpenChange,
	]);

	// Handle deletion error
	useEffect(() => {
		if (fetcher.data && !fetcher.data.success && fetcher.state === "idle") {
			toast.error(fetcher.data.message || "Failed to delete video");
		}
	}, [fetcher.data, fetcher.state]);

	// Cleanup body pointer-events when dialog closes
	useEffect(() => {
		if (!open) {
			// Ensure body pointer-events are reset when dialog closes
			const cleanup = setTimeout(() => {
				document.body.style.pointerEvents = "";
				// Also remove any Radix-specific attributes
				document.body.removeAttribute("data-scroll-locked");
			}, 100);

			return () => clearTimeout(cleanup);
		}
	}, [open]);

	const handleDelete = () => {
		const formData = new FormData();
		formData.append("intent", "delete");
		formData.append("videoId", video.id);

		fetcher.submit(formData, {
			method: "POST",
			action: "/resource/videos",
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Video</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete "{video.title}"? This action cannot
						be undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isDeleting}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={isDeleting}
					>
						{isDeleting ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Deleting...
							</>
						) : (
							"Delete"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
