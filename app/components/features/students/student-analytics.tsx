import { Users } from "lucide-react";
import { AnalyticsCard } from "~/components/global/admin/analytics-card";
import { useDashboardLoaderData } from "~/routes/_admin.dashboard";

export function StudentAnalytics() {
	const { totalStudentsCount, activeStudentsCount, inactiveStudentsCount } =
		useDashboardLoaderData();
	return (
		<div className="flex flex-col gap-4 pb-4">
			<h2 className="text-2xl">Students Analytics Data</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				<AnalyticsCard
					title="Total Students"
					value={totalStudentsCount}
					icon={Users}
					description="All registered students"
				/>
				<AnalyticsCard
					title="Active Students"
					value={activeStudentsCount}
					icon={Users}
					description="All active students"
				/>
				<AnalyticsCard
					title="Inactive Students"
					value={inactiveStudentsCount}
					icon={Users}
					description="All inactive students"
				/>
			</div>
		</div>
	);
}
