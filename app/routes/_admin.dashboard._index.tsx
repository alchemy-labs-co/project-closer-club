import { CoursesAnalytics } from "~/components/features/courses/courses/courses-analytics";
import { StudentAnalytics } from "~/components/features/students/student-analytics";

export default function Page() {
	return (
		<div className="flex flex-col gap-8 divide-y divide-border py-4">
			<StudentAnalytics />
			<CoursesAnalytics />
		</div>
	);
}
