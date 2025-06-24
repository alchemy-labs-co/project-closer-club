import { Skeleton } from "~/components/ui/skeleton";

// Course card skeleton
export function CourseCardSkeleton() {
	return (
		<div className="rounded-lg border bg-card min-h-[calc(100dvh-var(--navbar-height))] text-card-foreground shadow-sm overflow-hidden">
			<div className="p-6 py-12">
				<div className="flex items-center gap-3 mb-4">
					<Skeleton className="h-12 w-12 rounded-full" />
					<div className="space-y-2">
						<Skeleton className="h-5 w-40" />
						<Skeleton className="h-4 w-24" />
					</div>
				</div>
				<Skeleton className="h-4 w-full mb-2" />
				<Skeleton className="h-4 w-3/4 mb-4" />
				<div className="flex justify-between items-center">
					<Skeleton className="h-8 w-24" />
					<Skeleton className="h-8 w-8 rounded-full" />
				</div>
			</div>
			<div className="p-6">
				<div className="flex items-center gap-3 mb-4">
					<Skeleton className="h-12 w-12 rounded-full" />
					<div className="space-y-2">
						<Skeleton className="h-5 w-40" />
						<Skeleton className="h-4 w-24" />
					</div>
				</div>
				<Skeleton className="h-4 w-full mb-2" />
				<Skeleton className="h-4 w-3/4 mb-4" />
				<div className="flex justify-between items-center">
					<Skeleton className="h-8 w-24" />
					<Skeleton className="h-8 w-8 rounded-full" />
				</div>
			</div>
			<div className="hidden md:block p-6">
				<div className="flex items-center gap-3 mb-4">
					<Skeleton className="h-12 w-12 rounded-full" />
					<div className="space-y-2">
						<Skeleton className="h-5 w-40" />
						<Skeleton className="h-4 w-24" />
					</div>
				</div>
				<Skeleton className="h-4 w-full mb-2" />
				<Skeleton className="h-4 w-3/4 mb-4" />
				<div className="flex justify-between items-center">
					<Skeleton className="h-8 w-24" />
					<Skeleton className="h-8 w-8 rounded-full" />
				</div>
			</div>
		</div>
	);
}
