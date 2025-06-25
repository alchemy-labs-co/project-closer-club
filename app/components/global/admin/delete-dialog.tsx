import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import type { FetcherResponse } from "~/lib/types";

interface HiddenInput {
	name: string;
	value: string;
}

interface DeleteDialogProps {
	resourceRoute: string;
	hiddenInputs: HiddenInput[];
	title: string;
	description: React.ReactNode;
	trigger: React.ReactNode;
}

export function DeleteDialog({
	resourceRoute,
	hiddenInputs,
	title,
	description,
	trigger,
}: DeleteDialogProps) {
	const fetcher = useFetcher<FetcherResponse>();
	const isSubmitting = fetcher.state !== "idle";
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>

			<DialogContent>
				<fetcher.Form
					className="flex flex-col gap-4"
					method="POST"
					action={resourceRoute}
				>
					{hiddenInputs.map((input, index) => (
						<input
							key={index}
							type="hidden"
							name={input.name}
							value={input.value}
						/>
					))}

					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
					</DialogHeader>
					<DialogDescription asChild>{description}</DialogDescription>
					<DialogFooter>
						<Button
							type="submit"
							variant="destructive"
							className="cursor-pointer"
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								"Delete"
							)}
						</Button>
					</DialogFooter>
				</fetcher.Form>
			</DialogContent>
		</Dialog>
	);
}
