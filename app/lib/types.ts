export type FetcherResponse = {
	success: boolean;
	message: string;
	redirectTo?: string;
};

export type VideoPlayerTypes = {
	type: "Vimeo" | "Youtube" | "Bunny";
	url: string;
};

export type FetcherSubmitQuizResponse = {
	success: boolean;
	message: string;
	passed?: boolean;
	score?: number;
	totalQuestions?: number;
	incorrectQuestions?: {
		questionIndex: number;
		question: string;
		selectedAnswer: number;
		correctAnswer: number;
		answers: string[];
	}[];
}