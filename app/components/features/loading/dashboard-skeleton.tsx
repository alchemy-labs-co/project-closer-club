import { Skeleton } from "~/components/ui/skeleton";
import {
	Card,
	CardContent,
	CardHeader,
	CardFooter,
} from "~/components/ui/card";

export function DashboardSkeleton() {
	return (
		<div className="flex flex-col gap-8 divide-y divide-border animate-pulse bg-gray-50 rounded-2xl h-full">
			<Skeleton className="mb-4 h-12 w-3/4" />
			<Skeleton className="mb-8 h-4 w-1/2" />
			<div className="space-y-4">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-3/4" />
			</div>
		</div>
	);
}

export function AnalyticsCardsSkeleton() {
	return (
		<div className="flex flex-col gap-4 pb-4 pt-4">
			<Skeleton className="h-8 w-60" />
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				<AnalyticsCardSkeleton />
				<AnalyticsCardSkeleton />
				<AnalyticsCardSkeleton />
			</div>
		</div>
	);
}

export function AnalyticsCardSkeleton() {
	return (
		<Card className="overflow-hidden">
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-4 w-4 rounded-full" />
			</CardHeader>
			<CardContent>
				<Skeleton className="h-8 w-16 mb-2" />
				<Skeleton className="h-3 w-32" />
			</CardContent>
		</Card>
	);
}

export function TableSkeleton() {
	return (
		<div className="flex flex-col gap-4 h-full overflow-hidden">
			<div className="flex flex-row justify-between w-full">
				<Skeleton className="h-6 w-24" />
				<Skeleton className="h-9 w-32 rounded-md" />
			</div>
			<div className="border rounded-lg overflow-hidden">
				<div className="p-4 bg-card">
					<Skeleton className="h-8 w-36" />
				</div>
				<div className="p-4">
					<div className="flex items-center justify-between py-2 border-b">
						{Array.from({ length: 5 }).map((_, i) => (
							<Skeleton key={i} className="h-4 w-full max-w-[120px] mx-2" />
						))}
					</div>
					{Array.from({ length: 5 }).map((_, i) => (
						<div
							key={i}
							className="flex items-center justify-between py-4 border-b"
						>
							{Array.from({ length: 5 }).map((_, j) => (
								<Skeleton key={j} className="h-4 w-full max-w-[120px] mx-2" />
							))}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export function ProfileSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<Skeleton className="h-9 w-32" />

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Main Info Card Skeleton */}
				<Card className="md:col-span-2">
					<CardHeader>
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
							<div>
								<Skeleton className="h-8 w-48 mb-2" />
								<Skeleton className="h-5 w-64" />
							</div>
							<div className="flex items-center gap-2">
								<Skeleton className="h-5 w-16 rounded-full" />
								<Skeleton className="h-9 w-20 rounded-md" />
							</div>
						</div>
					</CardHeader>
					<CardContent className="pt-6">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
							{Array.from({ length: 4 }).map((_, i) => (
								<div key={i} className="flex items-start gap-3">
									<Skeleton className="h-9 w-9 rounded-full" />
									<div className="flex-1">
										<Skeleton className="h-4 w-24 mb-2" />
										<Skeleton className="h-5 w-32" />
									</div>
								</div>
							))}
						</div>
					</CardContent>
					<CardFooter className="flex justify-end gap-2">
						<Skeleton className="h-9 w-28 rounded-md" />
					</CardFooter>
				</Card>

				{/* Status Card Skeleton */}
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-32 mb-2" />
						<Skeleton className="h-4 w-48" />
					</CardHeader>
					<CardContent>
						<div className="flex flex-col gap-4">
							{Array.from({ length: 2 }).map((_, i) => (
								<div key={i} className="flex items-center justify-between">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-5 w-16 rounded-full" />
								</div>
							))}
						</div>
					</CardContent>
					<CardFooter className="flex justify-end">
						<Skeleton className="h-9 w-28 rounded-md" />
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
