import { Link } from "react-router";
import { cn } from "~/lib/utils";
export function PrimaryLogo({
	classNames,
	children,
}: {
	classNames?: {
		img?: string;
		link?: string;
	};
	children?: React.ReactNode;
}) {
	return (
		<Link
			to={"/"}
			className={cn("flex items-center justify-center gap-2", classNames?.link)}
		>
			<img
				src={"/assets/LOGO.png"}
				alt="Brand Logo"
				className={cn("w-10 h-10 rounded-full", classNames?.img)}
			/>
			{children}
		</Link>
	);
}
