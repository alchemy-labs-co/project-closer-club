import { cn } from "~/lib/utils";

interface StatusBadgeProps {
	status?: boolean;
	className?: string;
}

export function StatusBadge({ status = false, className }: StatusBadgeProps) {
	return (
		<div
			className={cn(
				"inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs",
				status && "bg-green-100 text-green-800",
				!status && "bg-red-100 text-red-800",
				className,
			)}
		>
			<span className="relative mr-1.5 flex h-2 w-2">
				<span className="absolute z-0 inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75"></span>
				<span className="relative inline-flex h-2 w-2 rounded-full bg-current"></span>
			</span>
			{status ? "Active" : "Inactive"}
		</div>
	);
}
