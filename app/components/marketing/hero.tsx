import { motion, useScroll } from "motion/react";
import React from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

const menuItems = [
	{ name: "Features", href: "#features" },
	{ name: "About", href: "#about" },
];

export function HeroSection() {
	return (
		<section className="relative min-h-screen overflow-hidden">
			<HeroHeader />
			<div className="relative z-30 py-24 pb-12 lg:pt-72">
				<div className="mx-auto flex max-w-7xl flex-col items-center lg:items-start px-6 lg:px-12">
					<div className="w-full flex flex-col items-center lg:items-start gap-12">
						<div className="flex flex-col gap-8 max-w-2xl w-full">
							<div className="flex flex-col gap-6">
								<h1 className="text-balance text-5xl text-white font-display md:text-6xl lg:mt-16 xl:text-7xl">
									Transform Your Insurance Career with Closer Club
								</h1>
								<p className="text-lg text-white/80">
									Elevate your insurance sales game with our comprehensive
									virtual training platform. Get standardized, high-quality
									training from anywhere, and fast-track your path to success.
								</p>
							</div>
							<div className="flex justify-center lg:justify-start">
								<Link
									className="inline-flex items-center bg-white text-black hover:bg-white/90 py-3 px-6 rounded-full text-base font-medium transition-colors"
									to="#join-team"
								>
									Join the Team
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="absolute inset-0 w-full h-full p-4 md:p-6">
				<div className="absolute inset-0 overflow-hidden  sm:aspect-video">
					<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-black/30 z-10" />
					<video
						autoPlay
						loop
						className="h-full w-full object-cover opacity-40"
						src="https://storage.googleapis.com/msgsndr/TmucnOzWpX4HavNHhejF/media/64c9ad48e17f578000053416.mp4"
						muted
						playsInline
						preload="auto"
					/>
				</div>
			</div>
		</section>
	);
}

const HeroHeader = () => {
	const [scrolled, setScrolled] = React.useState(false);
	const { scrollYProgress } = useScroll();

	React.useEffect(() => {
		const unsubscribe = scrollYProgress.on("change", (latest) => {
			setScrolled(latest > 0.05);
		});
		return () => unsubscribe();
	}, [scrollYProgress]);

	return (
		<header>
			<nav className="group fixed z-50 w-full pt-2">
				<div
					className={cn(
						"mx-auto max-w-7xl rounded-3xl px-6 transition-all duration-300 lg:px-12",
						scrolled && "bg-background/50 backdrop-blur-3xl",
					)}
				>
					<motion.div
						key={1}
						className={cn(
							"relative flex flex-wrap items-center justify-between gap-6 py-3 duration-200 lg:gap-0 lg:py-6",
							scrolled && "lg:py-4",
						)}
					>
						<div className="flex w-full items-center justify-between gap-12 lg:w-auto">
							<Link
								to="/"
								aria-label="home"
								className="flex items-center space-x-2"
							>
								<span
									className={cn(
										"text-xl font-semibold text-white",
										scrolled && "text-black",
									)}
								>
									Closer Club
								</span>
							</Link>

							<div className="hidden lg:block">
								<ul className="flex gap-8 text-sm">
									{menuItems.map((item) => (
										<li key={item.name}>
											<Link
												to={item.href}
												className={cn(
													"text-white hover:text-white/80 block duration-150",
													scrolled && "text-black",
												)}
											>
												<span>{item.name}</span>
											</Link>
										</li>
									))}
								</ul>
							</div>
						</div>

						<div className="bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
							<div className="lg:hidden">
								<ul className="space-y-6 text-base">
									{menuItems.map((item) => (
										<li key={item.name}>
											<Link
												to={item.href}
												className="text-white hover:text-white/80 block duration-150"
											>
												<span>{item.name}</span>
											</Link>
										</li>
									))}
								</ul>
							</div>
							<div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
								<Button asChild size="sm">
									<Link to="/login">
										<span>Login</span>
									</Link>
								</Button>
							</div>
						</div>
					</motion.div>
				</div>
			</nav>
		</header>
	);
};
