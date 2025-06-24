import { X } from "lucide-react";
import * as React from "react";

import { Command as CommandPrimitive } from "cmdk";
import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useFetcher } from "react-router";
import { Badge } from "~/components/ui/badge";
import {
	Command,
	CommandGroup,
	CommandItem,
	CommandList,
} from "~/components/ui/command";
import type { Course } from "~/db/schema";
import type { CreateStudentSchema } from "~/lib/zod-schemas/student";
import LoadingInputShimmer from "../loading/input-skeleton";

type FetcherResponse = {
	courses: Course[];
};
export function AssignCourseToStudent({
	form,
}: {
	form: UseFormReturn<CreateStudentSchema>;
}) {
	const fetcher = useFetcher<FetcherResponse>();
	const [courses, setCourses] = useState<Course[] | []>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [open, setOpen] = React.useState(false);
	const [selected, setSelected] = React.useState<Course[]>([]);
	const [inputValue, setInputValue] = React.useState("");
	const inputRef = React.useRef<HTMLInputElement>(null);

	useEffect(() => {
		const isDataLoaded = courses.length > 0;
		if (!isDataLoaded) {
			fetcher.load("/resource/student-courses");
			if (fetcher.data) {
				const { courses } = fetcher.data;
				setIsLoading(false);
				setCourses(courses);
			}
		}
	}, [fetcher.data]);
	const handleUnselect = React.useCallback((course: Course) => {
		setSelected((prev) => prev.filter((s) => s.id !== course.id));
		// attach the ids of the selected courses to the form
		form.setValue(
			"courses",
			form.getValues("courses")?.filter((s) => s !== course.id) ?? []
		);
	}, []);

	const handleKeyDown = React.useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			const input = inputRef.current;
			if (input) {
				if (e.key === "Delete" || e.key === "Backspace") {
					if (input.value === "") {
						setSelected((prev) => {
							const newSelected = [...prev];
							newSelected.pop();
							return newSelected;
						});
					}
				}
				// This is not a default behaviour of the <input /> field
				if (e.key === "Escape") {
					input.blur();
				}
			}
		},
		[]
	);

	const selectables = courses.filter((course) => !selected.includes(course));
	return (
		<div>
			{isLoading ? (
				<LoadingInputShimmer />
			) : (
				<Command
					onKeyDown={handleKeyDown}
					className="overflow-visible bg-transparent"
				>
					<div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
						<div className="flex flex-wrap gap-1">
							{selected.map((course) => {
								return (
									<Badge key={course.id} variant="secondary">
										{course.name}
										<button
											className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													handleUnselect(course);
												}
											}}
											onMouseDown={(e) => {
												e.preventDefault();
												e.stopPropagation();
											}}
											onClick={() => handleUnselect(course)}
										>
											<X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
										</button>
									</Badge>
								);
							})}
							{/* Avoid having the "Search" Icon */}
							<CommandPrimitive.Input
								ref={inputRef}
								value={inputValue}
								onValueChange={setInputValue}
								onBlur={() => setOpen(false)}
								onFocus={() => setOpen(true)}
								placeholder="Select courses..."
								className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
							/>
						</div>
					</div>
					<div className="relative mt-2">
						<CommandList>
							{open && selectables.length > 0 ? (
								<div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
									<CommandGroup className="h-full overflow-auto">
										{selectables.map((course) => {
											return (
												<CommandItem
													key={course.id}
													onMouseDown={(e) => {
														e.preventDefault();
														e.stopPropagation();
													}}
													onSelect={(value) => {
														setInputValue("");
														setSelected((prev) => [...prev, course]);
														form.setValue("courses", [
															...(form.getValues("courses") ?? []),
															course.id,
														]);
													}}
													className={"cursor-pointer"}
												>
													{course.name}
												</CommandItem>
											);
										})}
									</CommandGroup>
								</div>
							) : null}
						</CommandList>
					</div>
				</Command>
			)}
		</div>
	);
}
