import type React from "react";
import { createContext, useContext, useState } from "react";
import type { Step } from "~/lib/types";
interface FormControlsContextProps {
	currentPageIndex: number;
	historicPageIndex: number;
	delta: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	isFinalPage: boolean;
	handleNext: () => void;
	handleBack: () => void;
	setCurrentPageIndex: (index: number) => void;
	setHistoricPageIndex: (index: number) => void;
	setPage: (index: number) => void;
}

const FormControlsContext = createContext<FormControlsContextProps | undefined>(
	undefined,
);

interface FormControlsProviderProps {
	children: React.ReactNode;
	steps: Step[];
}

export const FormControlsProvider: React.FC<FormControlsProviderProps> = ({
	children,
	steps,
}) => {
	const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
	const [historicPageIndex, setHistoricPageIndex] = useState<number>(0);

	const delta = currentPageIndex - historicPageIndex;

	const handleNext = () => {
		if (currentPageIndex === steps.length - 1) return;
		setCurrentPageIndex(currentPageIndex + 1);
		setHistoricPageIndex(currentPageIndex);
	};

	const handleBack = () => {
		if (currentPageIndex === 0) return;
		setCurrentPageIndex(currentPageIndex - 1);
		setHistoricPageIndex(currentPageIndex);
	};

	const setPage = (index: number) => {
		if (index === currentPageIndex) return;
		if (index > currentPageIndex + 1) return;

		setCurrentPageIndex(index);
		setHistoricPageIndex(currentPageIndex);
	};

	const hasNextPage = currentPageIndex < steps.length - 1;
	const hasPreviousPage = currentPageIndex > 0;
	const isFinalPage = currentPageIndex === steps.length - 1;

	return (
		<FormControlsContext.Provider
			value={{
				currentPageIndex,
				historicPageIndex,
				delta,
				hasNextPage,
				hasPreviousPage,
				handleNext,
				handleBack,
				setCurrentPageIndex,
				setHistoricPageIndex,
				setPage,
				isFinalPage,
			}}
		>
			{children}
		</FormControlsContext.Provider>
	);
};

export const useFormControls = (): FormControlsContextProps => {
	const context = useContext(FormControlsContext);
	if (!context) {
		throw new Error(
			"useFormControls must be used within a FormControlsProvider",
		);
	}
	return context;
};
