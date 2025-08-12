import { useFormControls } from "./use-lead-capture-form";
import type { Step } from "~/lib/types";
import { motion } from "motion/react";

export function ProgressBar({ steps }: { steps: Step[] }) {
	const { currentPageIndex } = useFormControls();

	// Calculate progress percentage (0 to 100)
	const progress = (currentPageIndex / (steps.length - 1)) * 100;

	return (
		<div className="w-full relative z-50">
			<div className="flex items-center justify-between mb-2">
				{steps.map((step, index) => (
					<div
						key={step.id}
						className={`relative flex flex-col items-center z-50 ${index === 0 ? "justify-start" : index === steps.length - 1 ? "justify-end" : "justify-center"}`}
					>
						<div
							className={`w-6 h-6 rounded-full flex items-center justify-center z-50
                                ${index <= currentPageIndex ? "bg-white text-black" : "bg-white/20 text-white/60"}`}
						>
							{index + 1}
						</div>
						{/* <div className="text-xs mt-2 font-medium hidden md:block">
                            {step.title}
                        </div> */}
					</div>
				))}
			</div>

			<div className="relative h-2 w-full bg-white/20 rounded-full overflow-hidden z-50">
				<motion.div
					className="absolute top-0 left-0 h-full bg-white rounded-full z-50"
					initial={{ width: 0 }}
					animate={{ width: `${progress}%` }}
					transition={{
						duration: 0.5,
						ease: "easeInOut",
						type: "spring",
						stiffness: 70,
						damping: 14,
					}}
				/>
			</div>
		</div>
	);
}
