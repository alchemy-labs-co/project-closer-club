import {
	type ColumnDef,
	type ColumnFiltersState,
	type SortingState,
	type VisibilityState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Columns,
} from "lucide-react";
import * as React from "react";
import { useEffect } from "react";
import { Link, href } from "react-router";
import { StatusBadge } from "~/components/features/students/status-badge";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
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
import type { Student } from "~/db/schema";
import { getAgentsForTeamLeader } from "~/lib/team-leaders/data-access/agents.server";
import { formatDateToString } from "~/lib/utils";
import type { Route } from "./+types/_team.team.agents";

export async function loader({ request }: Route.LoaderArgs) {
	const {
		data: { data, success, message },
	} = await getAgentsForTeamLeader(request);
	if (!success) {
		return {
			agents: [],
		};
	}

	return {
		agents: data,
	};
}

// Read-only columns definition for team agents view
const columns: ColumnDef<Student>[] = [
	{
		accessorKey: "name",
		header: "Name",
		enableHiding: false,
		cell: ({ row }) => (
			<Link
				className="hover:underline text-primary font-medium"
				to={href("/team/agents/:studentId", {
					studentId: row.original.studentId,
				})}
			>
				{row.original.name}
			</Link>
		),
	},
	{
		accessorKey: "email",
		header: "Email",
	},
	{
		accessorKey: "phone",
		header: "Phone",
	},
	{
		id: "Status",
		accessorKey: "isActivated",
		header: "Status",
		cell: ({ row }) => <StatusBadge status={row.original.isActivated} />,
	},
	{
		id: "Created at",
		accessorKey: "created_at",
		header: "Created At",
		cell: ({ row }) => (
			<span className="text-muted-foreground">
				{formatDateToString(row.original.createdAt)}
			</span>
		),
	},
];

function AgentsDataTable({ initialData }: { initialData: Student[] }) {
	const [data, setData] = React.useState(initialData);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[]
	);
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [pagination, setPagination] = React.useState({
		pageIndex: 0,
		pageSize: 8,
	});

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnVisibility,
			columnFilters,
			pagination,
		},
		getRowId: (row) => row.id.toString(),
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

	useEffect(() => {
		setData(initialData);
	}, [initialData]);

	return (
		<div className="w-full flex flex-col justify-between h-full gap-6 overflow-hidden">
			{/* Header */}
			<div className="flex flex-col gap-6 overflow-hidden">
				<div className="flex items-center justify-between">
					{/* Customize Columns */}
					<div className="flex items-center gap-2">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm">
									<Columns />
									<span className="hidden lg:inline">Customize Columns</span>
									<span className="lg:hidden">Columns</span>
									<ChevronDown />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56">
								{table
									.getAllColumns()
									.filter(
										(column) =>
											typeof column.accessorFn !== "undefined" &&
											column.getCanHide()
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
						Total: {data.length} agents
					</div>
				</div>
				{/* Table */}
				<div className="rounded-lg border overflow-y-auto [scrollbar-width:thin]">
					<Table>
						<TableHeader className="bg-muted sticky top-0 z-10">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => {
										return (
											<TableHead key={header.id} colSpan={header.colSpan}>
												{header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext()
													  )}
											</TableHead>
										);
									})}
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
													cell.getContext()
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
										No agents assigned to you yet.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>
			{/* Pagination */}
			{data.length > 0 && (
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
									{[8, 20, 30, 40, 50].map((pageSize) => (
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

export default function TeamAgents({ loaderData }: Route.ComponentProps) {
	const { agents } = loaderData;
	return (
		<div className="flex flex-col gap-6 p-6">
			<div className="flex flex-col gap-2">
				<h1 className="text-2xl font-bold">My Agents</h1>
				<p className="text-muted-foreground">
					Manage and monitor your assigned agents
				</p>
			</div>

			<div className="bg-white rounded-lg border min-h-0 flex-1">
				<div className="p-6 border-b">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-semibold">Agents List</h3>
					</div>
				</div>

				<div className="p-6 h-full">
					<AgentsDataTable initialData={agents} />
				</div>
			</div>
		</div>
	);
}
