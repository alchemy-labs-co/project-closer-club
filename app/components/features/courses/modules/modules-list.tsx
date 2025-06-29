import { useLocation, Link } from "react-router";
import { useEditorLoaderData } from "~/routes/_admin._editor";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion";

export function ModulesList() {
	const { modules, courseSlug } = useEditorLoaderData();
	const location = useLocation();
	const pathname = location.pathname;

	return (
		<div className="flex-1 relative h-full overflow-y-auto [scrollbar-width:thin]">
			<nav className="h-full w-full">
				<div className="space-y-2 w-full">
					{modules.map((module) => {
						const isModuleActive =
							pathname === `/dashboard/courses/${courseSlug}/${module.slug}` ||
							pathname.startsWith(
								`/dashboard/courses/${courseSlug}/${module.slug}/`,
							);

						// If module has no lessons, just display the module name as a clickable link
						if (module.lessons.length === 0) {
							return (
								<Link
									key={module.id}
									to={`/dashboard/courses/${courseSlug}/${module.slug}`}
									className={`block w-full p-3 text-left text-sm font-medium rounded-md border border-gray-200 transition-colors ${
										isModuleActive
											? "bg-blue-50 text-blue-700 border-blue-200"
											: "text-gray-700 bg-white hover:bg-gray-50"
									}`}
								>
									{module.name}
								</Link>
							);
						}

						// If module has lessons, use accordion
						return (
							<Accordion
								key={module.id}
								type="single"
								collapsible
								className="w-full"
								defaultValue={isModuleActive ? module.id : undefined}
							>
								<AccordionItem value={module.id} className="border-none">
									<AccordionTrigger
										className={`w-full p-3 text-left text-sm font-medium rounded-md border border-gray-200 hover:bg-gray-50 [&[data-state=open]]:rounded-b-none transition-colors ${
											isModuleActive
												? "bg-blue-50 text-blue-700 border-blue-200"
												: "text-gray-700 bg-white"
										}`}
									>
										<Link
											to={`/dashboard/courses/${courseSlug}/${module.slug}`}
											className="flex-1 text-left"
										>
											{module.name}
										</Link>
									</AccordionTrigger>
									<AccordionContent className="p-0 bg-white border border-gray-200 border-t-0 rounded-b-md">
										<ul className="space-y-0">
											{module.lessons.map((lesson) => {
												const isLessonActive =
													pathname ===
													`/dashboard/courses/${courseSlug}/${module.slug}/${lesson.slug}`;
												return (
													<li key={lesson.id}>
														<Link
															to={`/dashboard/courses/${courseSlug}/${module.slug}/${lesson.slug}`}
															className={`block px-4 py-2 text-sm transition-colors border-b border-gray-100 last:border-b-0 ${
																isLessonActive
																	? "bg-blue-50 text-blue-700 font-medium"
																	: "text-gray-600 hover:bg-gray-50"
															}`}
														>
															{lesson.name}
														</Link>
													</li>
												);
											})}
										</ul>
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						);
					})}
				</div>
				{/* Gradient mask to indicate scrollable content */}
				<div
					className="sticky bottom-0 left-0 right-0 h-16 pointer-events-none"
					style={{
						background:
							"linear-gradient(to bottom, transparent, rgb(249 250 251) 100%)",
					}}
				/>
			</nav>
		</div>
	);
}
