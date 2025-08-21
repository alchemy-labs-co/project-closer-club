export function AboutSection() {
	return (
		<section id="about" className="py-24 bg-white">
			<div className="mx-auto max-w-7xl px-6 lg:px-12">
				<div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24 items-center">
					{/* Text Content */}
					<div>
						<h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
							About Closer Club
						</h2>
						<p className="mt-6 text-lg leading-8 text-gray-600">
							Closer Club is revolutionizing insurance agent training by
							breaking down the barriers of traditional, location-dependent
							education. Our comprehensive virtual training platform enables
							nationwide recruitment and standardized onboarding, eliminating
							the constraints of physical office spaces.
						</p>
						<div className="mt-8 space-y-6">
							<div>
								<h3 className="text-xl font-semibold text-gray-900">
									Our Mission
								</h3>
								<p className="mt-2 text-gray-600">
									To provide every insurance agent with world-class training
									that accelerates their path to success, regardless of their
									location. We believe that high-quality education should be
									accessible to anyone with the drive to excel.
								</p>
							</div>
							<div>
								<h3 className="text-xl font-semibold text-gray-900">
									The Solution
								</h3>
								<p className="mt-2 text-gray-600">
									Our platform delivers consistent, trackable training through
									sequential learning paths, comprehensive assessments, and
									professional certification. What started as an internal
									solution is evolving into the industry standard for insurance
									agent education.
								</p>
							</div>
							<div>
								<h3 className="text-xl font-semibold text-gray-900">
									Looking Forward
								</h3>
								<p className="mt-2 text-gray-600">
									Built with scalability in mind, our platform is designed to
									serve the growing needs of insurance professionals nationwide,
									with plans to expand into a comprehensive subscription-based
									training ecosystem.
								</p>
							</div>
						</div>
					</div>

					{/* Closer Club Emblem */}
					<div className="relative">
						<div
							className="aspect-[4/5] rounded-2xl flex items-center justify-center p-12"
							style={{ backgroundColor: "#EDE9E5" }}
						>
							<img
								src="/logos/closer-club-emblem.png"
								alt="Closer Club Emblem"
								className="w-full h-full object-contain"
							/>
						</div>
						{/* Optional decorative elements */}
						<div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-100 rounded-full opacity-20" />
						<div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-50 rounded-full opacity-30" />
					</div>
				</div>
			</div>
		</section>
	);
}
