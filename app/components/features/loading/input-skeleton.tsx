interface LoadingInputShimmerProps {
	className?: string;
}

export default function LoadingInputShimmer({
	className,
}: LoadingInputShimmerProps) {
	return (
		<div className="relative overflow-hidden">
			<div
				className={`h-[38px] w-full rounded-md bg-gray-200  ${className}`}
				aria-label="Loading input field"
				role="status"
			>
				<div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
				<span className="sr-only">Loading input field</span>
			</div>
		</div>
	);
}
