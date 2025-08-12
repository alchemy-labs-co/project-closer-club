import * as React from "react";
import { cn } from "~/lib/utils";

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
	({ className, children, ...props }, ref) => {
		return (
			<div
				ref={ref}
				className={cn(
					"relative overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-border/80",
					className,
				)}
				{...props}
			>
				{children}
			</div>
		);
	},
);
ScrollArea.displayName = "ScrollArea";

export { ScrollArea };
