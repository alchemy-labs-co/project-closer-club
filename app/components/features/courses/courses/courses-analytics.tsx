import { Book, CircleCheck, Lock } from "lucide-react";
import { AnalyticsCard } from "~/components/global/admin/analytics-card";
import { useDashboardLoaderData } from "~/routes/_admin.dashboard";

export function CoursesAnalytics() {
	const { totalCoursesCount, totalPublicCourses, totalPrivateCourses } =
		useDashboardLoaderData();
	return (
		<div className="flex flex-col gap-4 pb-4">
			<h2 className="text-2xl">Courses Analytics Data</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				<AnalyticsCard
					title="Total Courses"
					value={totalCoursesCount}
					icon={Book}
					description="All registered courses"
				/>
				<AnalyticsCard
					title="Public Courses"
					value={totalPublicCourses}
					icon={CircleCheck}
					description="All public courses"
				/>
				<AnalyticsCard
					title="Private Courses"
					value={totalPrivateCourses}
					icon={Lock}
					description="All private courses"
				/>
			</div>
		</div>
	);
}
