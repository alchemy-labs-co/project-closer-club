import { Link } from "react-router";
import { cn } from "~/lib/utils";

export function PrimaryLogo({
	classNames,
	children,
	asButton = false,
}: {
	classNames?: {
		img?: string;
		link?: string;
	};
	children?: React.ReactNode;
	asButton?: boolean;
}) {
	const logoImage = (
		<img
			src={"/logos/closer-club-logo.png"}
			alt="Closer Club Logo"
			className={cn(
				"w-10 h-10 rounded-full object-contain flex-shrink-0",
				classNames?.img,
			)}
		/>
	);

	if (asButton) {
		return (
			<div
				className={cn(
					"flex items-center justify-center gap-2",
					classNames?.link,
				)}
			>
				{logoImage}
				{children}
			</div>
		);
	}

	return (
		<Link
			to={"/"}
			className={cn("flex items-center justify-center gap-2", classNames?.link)}
		>
			{logoImage}
			{children}
		</Link>
	);
}
