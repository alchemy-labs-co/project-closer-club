import { Button } from "~/components/ui/button";
import type { ComponentProps } from "react";

export default function PrimaryButton({
	children,
	className,
	...props
}: ComponentProps<typeof Button>) {
	return (
		<Button
			variant="outline"
			className="bg-brand-primary text-white cursor-pointer hover:bg-brand-primary/60 hover:text-white"
			{...props}
		>
			{children}
		</Button>
	);
}
