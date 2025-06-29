import { Heart } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { Button } from "~/components/ui/button";
import { studentNavItems } from "~/config/navigation";
import { cn, displayName } from "~/lib/utils";
import { useStudentLayoutData } from "~/routes/_agent";
import { LogoutProvider } from "../admin/logout";

const BASE_STUDENT_URL = "/student/courses";

export function StudentNavbar() {
	const { student } = useStudentLayoutData();
	const location = useLocation();
	const pathname = location.pathname;
	const display_name = displayName(student.name);
	return (
		<nav className="bg-[#333] sticky top-0 z-20 h-[var(--navbar-height)] [--widest-el:11.375rem]">
			<div className="flex items-center h-full justify-between px-4 max-w-7xl mx-auto xl:px-0">
				<div className="flex items-center gap-2">
					<p className="text-white">Welcome Back {display_name}</p>
					<Heart className="w-4 h-4 text-red-300" />
				</div>
				<div className="hidden md:flex items-center gap-2">
					{studentNavItems.map((link) => {
						const isActive = pathname.includes(BASE_STUDENT_URL);
						return (
							<Button
								key={link.href}
								variant={"outline"}
								className={cn(
									"hover:bg-brand-primary/80 border-none  bg-brand-primary  text-black",
									isActive && "bg-brand-primary text-white",
								)}
								asChild
							>
								<Link className="cursor-pointer" to={link.href} key={link.href}>
									{link.icon && <link.icon className="w-4 h-4" />}
									<span>{link.label}</span>
								</Link>
							</Button>
						);
					})}
				</div>
				<div className="hidden md:flex items-center gap-2 min-w-[var(--widest-el)]">
					<LogoutProvider type="student" />
				</div>
				<HamburgerMenu pathname={pathname} />
			</div>
		</nav>
	);
}

function HamburgerMenu({ pathname }: { pathname: string }) {
	const [isOpen, setIsOpen] = useState(false);

	// Handle click outside to close menu
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (isOpen && !target.closest(".mobile-menu-container")) {
				setIsOpen(false);
			}
		};
		document.addEventListener("click", handleClickOutside);
		return () => document.removeEventListener("click", handleClickOutside);
	}, [isOpen]);

	// Close menu on escape key
	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") setIsOpen(false);
		};
		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, []);

	return (
		<div className="md:hidden mobile-menu-container">
			<Button
				variant="outline"
				className="border-none"
				onClick={() => setIsOpen(!isOpen)}
				aria-expanded={isOpen}
				aria-label="Toggle navigation menu"
				aria-controls="mobile-menu"
			>
				<motion.div
					animate={isOpen ? "open" : "closed"}
					className="flex flex-col gap-1"
				>
					<motion.span
						variants={{
							closed: { rotate: 0, y: 0 },
							open: { rotate: 45, y: 6 },
						}}
						transition={{ duration: 0.3, ease: "easeInOut" }}
						className="h-0.5 w-6 bg-black block origin-center"
					/>
					<motion.span
						variants={{
							closed: { opacity: 1 },
							open: { opacity: 0 },
						}}
						transition={{ duration: 0.2 }}
						className="h-0.5 w-6 bg-black block origin-center"
					/>
					<motion.span
						variants={{
							closed: { rotate: 0, y: 0 },
							open: { rotate: -45, y: -6 },
						}}
						transition={{ duration: 0.3, ease: "easeInOut" }}
						className="h-0.5 w-6 bg-black block origin-center"
					/>
				</motion.div>
			</Button>

			<motion.div
				id="mobile-menu"
				initial={{ opacity: 0, y: -20 }}
				animate={{
					opacity: isOpen ? 1 : 0,
					y: isOpen ? 0 : -20,
					display: isOpen ? "flex" : "none",
				}}
				transition={{ duration: 0.2 }}
				className="absolute top-[var(--navbar-height)] left-0 right-0 z-30 bg-[#333] flex-col gap-4 p-4 shadow-lg"
			>
				{studentNavItems.map((link) => {
					const isActive = pathname.includes(BASE_STUDENT_URL);
					return (
						<Button
							key={link.href}
							variant={"outline"}
							className={cn(
								"w-full hover:bg-brand-primary/80 border-none text-white",
								isActive && "bg-brand-primary text-white",
							)}
							asChild
						>
							<Link className="cursor-pointer" to={link.href}>
								{link.icon && <link.icon className="w-4 h-4" />}
								<span>{link.label}</span>
							</Link>
						</Button>
					);
				})}
				<LogoutProvider className="w-full" type="student" />
			</motion.div>
		</div>
	);
}
