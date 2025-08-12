import {
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
	type ColumnFiltersState,
	type SortingState,
	type VisibilityState,
} from "@tanstack/react-table";
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Columns,
	X,
} from "lucide-react";
import * as React from "react";
import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import type { TeamLeaderAnalytics } from "~/lib/team-leaders/data-access/analytics/team-analytics.server";

type AgentData = TeamLeaderAnalytics["agentAnalytics"]["agents"][0];

const columns: ColumnDef<AgentData>[] = [
	{
		accessorKey: "name",
		header: "Agent Name",
		enableHiding: false,
		cell: ({ row }) => (
			<div className="flex flex-col">
				<span className="font-medium">{row.original.name}</span>
				<span className="text-sm text-muted-foreground">
					{row.original.email}
				</span>
			</div>
		),
	},
	{
		accessorKey: "isActivated",
		header: "Status",
		cell: ({ row }) => (
			<Badge variant={row.original.isActivated ? "default" : "destructive"}>
				{row.original.isActivated ? "Active" : "Inactive"}
			</Badge>
		),
	},
	{
		id: "courses",
		accessorKey: "summary.totalEnrolledCourses",
		header: "Courses",
		cell: ({ row }) => <span>{row.original.summary.totalEnrolledCourses}</span>,
	},
	{
		id: "progress",
		accessorKey: "summary.averageProgress",
		header: "Progress",
		cell: ({ row }) => {
			const progress = row.original.summary.averageProgress;
			return (
				<div className="flex items-center gap-2">
					<div className="w-20 bg-gray-200 rounded-full h-2">
						<div
							className="bg-blue-600 h-2 rounded-full"
							style={{ width: `${progress}%` }}
						/>
					</div>
					<span className="text-sm">{progress}%</span>
				</div>
			);
		},
	},
	{
		id: "quizScore",
		accessorKey: "summary.overallAverageQuizScore",
		header: "Quiz Score",
		cell: ({ row }) => {
			const score = row.original.summary.overallAverageQuizScore;
			return (
				<span
					className={`font-medium ${
						score >= 80
							? "text-green-600"
							: score >= 60
								? "text-yellow-600"
								: "text-red-600"
					}`}
				>
					{score}%
				</span>
			);
		},
	},
	{
		id: "accuracy",
		accessorKey: "summary.overallAccuracy",
		header: "Accuracy",
		cell: ({ row }) => {
			const accuracy = row.original.summary.overallAccuracy;
			return (
				<span
					className={`font-medium ${
						accuracy >= 80
							? "text-green-600"
							: accuracy >= 60
								? "text-yellow-600"
								: "text-red-600"
					}`}
				>
					{accuracy}%
				</span>
			);
		},
	},
	{
		id: "actions",
		header: "Actions",
		cell: ({ row }) => (
			<Link
				to={`/team/agents/${row.original.studentId}`}
				className="text-blue-600 hover:text-blue-800 text-sm"
			>
				View Details
			</Link>
		),
	},
];

export function TeamAnalyticsDataTable({
	agentData,
}: {
	agentData: TeamLeaderAnalytics["agentAnalytics"]["agents"];
}) {
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [pagination, setPagination] = React.useState({
		pageIndex: 0,
		pageSize: 10,
	});

	const table = useReactTable({
		data: agentData,
		columns,
		state: {
			sorting,
			columnVisibility,
			columnFilters,
			pagination,
		},
		getRowId: (row) => row.id,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	});

	const isFiltered = table.getState().columnFilters.length > 0;

	return (
		<div className="w-full flex flex-col justify-between h-full gap-6 overflow-hidden">
			<div className="flex flex-col gap-4 overflow-hidden">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Input
							placeholder="Filter by name..."
							value={
								(table.getColumn("name")?.getFilterValue() as string) ?? ""
							}
							onChange={(event) =>
								table.getColumn("name")?.setFilterValue(event.target.value)
							}
							className="h-8 w-[200px]"
						/>
						<Select
							value={
								(table.getColumn("isActivated")?.getFilterValue() as string) ??
								"all"
							}
							onValueChange={(value) => {
								if (value === "all") {
									table.getColumn("isActivated")?.setFilterValue(undefined);
								} else {
									table
										.getColumn("isActivated")
										?.setFilterValue(value === "active");
								}
							}}
						>
							<SelectTrigger className="w-[140px] h-8">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="active">Active</SelectItem>
								<SelectItem value="inactive">Inactive</SelectItem>
							</SelectContent>
						</Select>

						{isFiltered && (
							<Button
								variant="ghost"
								onClick={() => table.resetColumnFilters()}
								className="h-8 px-2 lg:px-3"
							>
								Reset
								<X />
							</Button>
						)}

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm" className="h-8">
									<Columns />
									<span className="hidden lg:inline">Columns</span>
									<ChevronDown />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56">
								{table
									.getAllColumns()
									.filter(
										(column) =>
											typeof column.accessorFn !== "undefined" &&
											column.getCanHide(),
									)
									.map((column) => {
										return (
											<DropdownMenuCheckboxItem
												key={column.id}
												className="capitalize"
												checked={column.getIsVisible()}
												onCheckedChange={(value) =>
													column.toggleVisibility(!!value)
												}
											>
												{column.id}
											</DropdownMenuCheckboxItem>
										);
									})}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<div className="text-sm text-muted-foreground">
						Total: {agentData.length} agents
					</div>
				</div>

				<div className="rounded-lg border overflow-y-auto [scrollbar-width:thin]">
					<Table>
						<TableHeader className="bg-muted sticky top-0 z-10">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead key={header.id} colSpan={header.colSpan}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow key={row.id}>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center"
									>
										No agents found.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>

			{/* Pagination */}
			{agentData.length > 0 && (
				<div className="flex items-center justify-between px-4">
					<div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
						Showing {table.getFilteredRowModel().rows.length} of{" "}
						{table.getFilteredRowModel().rows.length} agents
					</div>
					<div className="flex w-full items-center gap-8 lg:w-fit">
						<div className="hidden items-center gap-2 lg:flex">
							<Label htmlFor="rows-per-page" className="text-sm font-medium">
								Rows per page
							</Label>
							<Select
								value={`${table.getState().pagination.pageSize}`}
								onValueChange={(value) => {
									table.setPageSize(Number(value));
								}}
							>
								<SelectTrigger size="sm" className="w-20" id="rows-per-page">
									<SelectValue
										placeholder={table.getState().pagination.pageSize}
									/>
								</SelectTrigger>
								<SelectContent side="top">
									{[5, 10, 20, 30, 50].map((pageSize) => (
										<SelectItem key={pageSize} value={`${pageSize}`}>
											{pageSize}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex w-fit items-center justify-center text-sm font-medium">
							Page {table.getState().pagination.pageIndex + 1} of{" "}
							{table.getPageCount()}
						</div>
						<div className="ml-auto flex items-center gap-2 lg:ml-0">
							<Button
								variant="outline"
								className="hidden h-8 w-8 p-0 lg:flex"
								onClick={() => table.setPageIndex(0)}
								disabled={!table.getCanPreviousPage()}
							>
								<span className="sr-only">Go to first page</span>
								<ChevronsLeft />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
							>
								<span className="sr-only">Go to previous page</span>
								<ChevronLeft />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
							>
								<span className="sr-only">Go to next page</span>
								<ChevronRight />
							</Button>
							<Button
								variant="outline"
								className="hidden size-8 lg:flex"
								size="icon"
								onClick={() => table.setPageIndex(table.getPageCount() - 1)}
								disabled={!table.getCanNextPage()}
							>
								<span className="sr-only">Go to last page</span>
								<ChevronsRight />
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
