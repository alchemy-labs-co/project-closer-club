import { Command as CommandPrimitive } from "cmdk";
import { ChevronDown } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import {
	Command,
	CommandGroup,
	CommandItem,
	CommandList,
} from "~/components/ui/command";
import type { Segment } from "~/db/schema";
import LoadingInputShimmer from "../../loading/input-skeleton";

type FetcherResponse = {
	lessons: Segment[];
};

export function SelectLesson({
	selectedLessonId,
	onLessonSelect,
}: {
	selectedLessonId?: string;
	onLessonSelect: (lessonId: string | null) => void;
}) {
	const fetcher = useFetcher<FetcherResponse>();
	const [lessons, setLessons] = useState<Segment[] | []>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [open, setOpen] = React.useState(false);
	const [inputValue, setInputValue] = React.useState("");
	const inputRef = React.useRef<HTMLInputElement>(null);

	const selectedLesson = lessons.find(
		(lesson) => lesson.id === selectedLessonId
	);

	useEffect(() => {
		const isDataLoaded = lessons.length > 0;
		if (!isDataLoaded) {
			fetcher.load("/resource/all-lessons");
			if (fetcher.data) {
				const { lessons } = fetcher.data;
				setIsLoading(false);
				setLessons(lessons);
			}
		}
	}, [fetcher.data]);

	const handleKeyDown = React.useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			const input = inputRef.current;
			if (input) {
				// This is not a default behaviour of the <input /> field
				if (e.key === "Escape") {
					input.blur();
					setOpen(false);
				}
			}
		},
		[]
	);

	const filteredLessons = lessons.filter(
		(lesson) =>
			lesson.name.toLowerCase().includes(inputValue.toLowerCase()) ||
			lesson.slug.toLowerCase().includes(inputValue.toLowerCase())
	);

	return (
		<div className="w-full">
			{isLoading ? (
				<LoadingInputShimmer />
			) : (
				<Command
					onKeyDown={handleKeyDown}
					className="overflow-visible cursor-pointer"
					onClick={() => setOpen(!open)}
				>
					<div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 relative">
						<div className="flex items-center justify-between">
							<div className="flex-1">
								{selectedLesson ? (
									<div className="flex items-center gap-2">
										<span className="text-sm font-medium">
											{selectedLesson.name}
										</span>
									</div>
								) : (
									<CommandPrimitive.Input
										ref={inputRef}
										value={inputValue}
										onValueChange={setInputValue}
										onBlur={() => setOpen(false)}
										onFocus={() => setOpen(true)}
										placeholder="Search lessons..."
										className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
									/>
								)}
							</div>
							<div className="flex items-center gap-2">
								{selectedLesson && (
									<button
										type="button"
										onClick={() => {
											onLessonSelect(null);
											setInputValue("");
										}}
										className="text-xs text-muted-foreground hover:text-foreground"
									>
										Clear
									</button>
								)}
								<ChevronDown className="h-4 w-4 text-muted-foreground cursor-pointer" />
							</div>
						</div>
					</div>
					<div className="relative mt-2">
						<CommandList>
							<SelectableLessonsList
								open={open}
								lessons={filteredLessons}
								setInputValue={setInputValue}
								onLessonSelect={onLessonSelect}
								setOpen={setOpen}
							/>
						</CommandList>
					</div>
				</Command>
			)}
		</div>
	);
}

function SelectableLessonsList({
	open,
	lessons,
	setInputValue,
	onLessonSelect,
	setOpen,
}: {
	open: boolean;
	lessons: Segment[];
	onLessonSelect: (lessonId: string) => void;
	setInputValue: React.Dispatch<React.SetStateAction<string>>;
	setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
	return (
		open &&
		lessons.length > 0 && (
			<div className="absolute top-0 z-[99] w-full rounded-md border h-[200px] overflow-y-auto bg-popover text-popover-foreground shadow-md outline-none animate-in">
				<CommandGroup className="z-[99]">
					{lessons.map((lesson) => {
						return (
							<CommandItem
								key={lesson.id}
								onMouseDown={(e) => {
									e.preventDefault();
									e.stopPropagation();
								}}
								onSelect={() => {
									setInputValue("");
									onLessonSelect(lesson.id);
									setOpen(false);
								}}
								className={"cursor-pointer"}
							>
								<div className="flex flex-col gap-1">
									<span className="font-medium">{lesson.name}</span>

									{lesson.description && (
										<span className="text-xs text-muted-foreground  w-full">
											{lesson.description}
										</span>
									)}
								</div>
							</CommandItem>
						);
					})}
				</CommandGroup>
			</div>
		)
	);
}
