import { Link } from "react-router";
import { cn } from "~/lib/utils";
import type { Segment } from "~/db/schema";

interface SegmentListItemProps {
	segment: Segment;
	courseSlug: string;
	isActive: boolean;
}

export function SegmentListItem({
	segment,
	courseSlug,
	isActive,
}: SegmentListItemProps) {
	return (
		<li key={segment.id} className="w-full">
			<Link
				className={cn(
					"text-sm capitalize block bg-gray-100 hover:bg-gray-400 transition-all duration-300 w-full p-2 rounded-md text-gray-500 hover:text-gray-700",
					isActive && "bg-brand-primary text-white",
				)}
				to={`/dashboard/courses/${courseSlug}/${segment.slug}`}
			>
				<div className="w-full flex justify-between items-center">
					<p>{segment.name}</p>
				</div>
			</Link>
		</li>
	);
}
