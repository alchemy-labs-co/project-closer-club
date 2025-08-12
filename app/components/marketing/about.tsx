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

					{/* Image Placeholder */}
					<div className="relative">
						<div className="aspect-[4/5] rounded-2xl bg-gray-200 flex items-center justify-center">
							<div className="text-center">
								<div className="w-16 h-16 mx-auto mb-4 bg-gray-300 rounded-full flex items-center justify-center">
									<svg
										className="w-8 h-8 text-gray-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-labelledby="image-icon-title"
									>
										<title id="image-icon-title">Image placeholder icon</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z"
										/>
									</svg>
								</div>
								<p className="text-gray-500 text-sm">Team Photo Placeholder</p>
								<p className="text-gray-400 text-xs mt-1">
									1200 x 1500 recommended
								</p>
							</div>
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
