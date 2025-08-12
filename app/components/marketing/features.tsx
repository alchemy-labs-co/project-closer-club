import {
	CheckCircle,
	Play,
	BarChart3,
	Award,
	Users,
	Shield,
} from "lucide-react";

const features = [
	{
		icon: Play,
		title: "Sequential Learning Path",
		description:
			"Structured training modules that must be completed in order, ensuring comprehensive understanding before advancing.",
	},
	{
		icon: BarChart3,
		title: "Progress Tracking",
		description:
			"Visual progress bars and completion indicators help agents track their journey and administrators monitor performance.",
	},
	{
		icon: Award,
		title: "Certification System",
		description:
			"Earn professional certificates upon course completion, providing tangible proof of your training achievements.",
	},
	{
		icon: CheckCircle,
		title: "Assessment & Quizzes",
		description:
			"Mini-quizzes verify comprehension and ensure agents master each concept before moving forward.",
	},
	{
		icon: Users,
		title: "Role-Based Access",
		description:
			"Tailored experiences for Agents, Team Leaders, and Administrators with appropriate permissions and dashboards.",
	},
	{
		icon: Shield,
		title: "Secure & Compliant",
		description:
			"Domain-restricted access and comprehensive analytics ensure compliance and maintain training standards.",
	},
];

export function FeaturesSection() {
	return (
		<section id="features" className="py-24 bg-gray-50">
			<div className="mx-auto max-w-7xl px-6 lg:px-12">
				<div className="mx-auto max-w-4xl text-center">
					<h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
						Everything You Need to Excel
					</h2>
					<p className="mt-6 text-lg leading-8 text-gray-600">
						Our comprehensive training platform provides all the tools and
						features necessary to transform your insurance career and scale your
						success.
					</p>
				</div>
				<div className="mx-auto mt-16 max-w-7xl">
					<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
						{features.map((feature) => (
							<div
								key={feature.title}
								className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
							>
								<div className="flex items-center">
									<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
										<feature.icon
											className="h-6 w-6 text-white"
											aria-hidden="true"
										/>
									</div>
								</div>
								<div className="mt-6">
									<h3 className="text-lg font-semibold text-gray-900">
										{feature.title}
									</h3>
									<p className="mt-2 text-gray-600">{feature.description}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
