import { useFormContext } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { useFormControls } from "./use-lead-capture-form";

import type { Step } from "~/lib/types";

const FormFooter = ({ steps }: { steps: Step[] }) => {

	const {
		handleBack,
		handleNext,
		hasPreviousPage,
		isFinalPage,
		currentPageIndex,
	} = useFormControls();
	const { trigger } = useFormContext();

	return (
		<div className="flex w-full justify-between px-7 relative z-50">
			<Button
				onClick={handleBack}
				className="cursor-pointer bg-white text-black hover:bg-white/90 relative z-50"
				type="button"
				disabled={!hasPreviousPage}
			>
				Back
			</Button>

			<Button
				type="submit"
				className={`${
					isFinalPage ? "cursor-pointer" : "hidden"
				} bg-white text-black hover:bg-white/90 relative z-50`}
				
			>
				Submit
			</Button>
			<Button
				onClick={async () => {
					const res = await trigger(steps[currentPageIndex].inputs, {
						shouldFocus: true,
					});
					if (!res) {
						return;
					}
					handleNext();
				}}
				type="button"
				className={`${
					isFinalPage ? "hidden" : "cursor-pointer"
				} bg-white text-black hover:bg-white/90 relative z-50`}
			>
				Next
			</Button>
		</div>
	);
};

export default FormFooter;
