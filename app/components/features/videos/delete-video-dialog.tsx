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

	// Store original body styles and cleanup when dialog closes
	useEffect(() => {
		let originalStyles: {
			overflow?: string;
			pointerEvents?: string;
			userSelect?: string;
			paddingRight?: string;
		} = {};

		if (open) {
			// Store original styles when dialog opens
			const computedStyle = getComputedStyle(document.body);
			originalStyles = {
				overflow: document.body.style.overflow || computedStyle.overflow,
				pointerEvents: document.body.style.pointerEvents || computedStyle.pointerEvents,
				userSelect: document.body.style.userSelect || computedStyle.userSelect,
				paddingRight: document.body.style.paddingRight || computedStyle.paddingRight,
			};
		} else {
			// Comprehensive cleanup when dialog closes
			const cleanup = setTimeout(() => {
				// Reset all potentially modified body styles
				document.body.style.overflow = "";
				document.body.style.pointerEvents = "";
				document.body.style.userSelect = "";
				document.body.style.paddingRight = "";
				
				// Remove all Radix-specific attributes
				document.body.removeAttribute("data-scroll-locked");
				document.body.removeAttribute("data-radix-scroll-area-viewport");
				document.body.removeAttribute("style");
				
				// Force a reflow to ensure styles are applied
				document.body.offsetHeight;
			}, 50);

			return () => clearTimeout(cleanup);
		}

		// Cleanup function for component unmount
		return () => {
			if (open) {
				// Emergency cleanup if component unmounts while open
				document.body.style.overflow = "";
				document.body.style.pointerEvents = "";
				document.body.style.userSelect = "";
				document.body.style.paddingRight = "";
				document.body.removeAttribute("data-scroll-locked");
				document.body.removeAttribute("data-radix-scroll-area-viewport");
			}
		};
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
