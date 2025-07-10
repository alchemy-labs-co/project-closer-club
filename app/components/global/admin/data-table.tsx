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
	MoreVertical,
	X,
} from "lucide-react";
import * as React from "react";
import { Link, href } from "react-router";
import { ActivateStudent } from "~/components/features/students/activate-student";
import { CreateStudent } from "~/components/features/students/create-student";
import { DeactivateStudent } from "~/components/features/students/deactivate-student";	
import { StatusBadge } from "~/components/features/students/status-badge";

import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Label } from "~/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
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
import { formatDateToString } from "~/lib/utils";
import { DeleteDialog } from "./delete-dialog";
import AgentAnalayticsDrawer from "~/components/features/analytics/agent-analytics-drawer";

const columns: ColumnDef<Student>[] = [
	{
		accessorKey: "name",
		header: "Name",
		enableHiding: false,
		cell: ({ row }) => (
			<Link
				className="hover:underline"
				to={href("/dashboard/agents/:studentId", {
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
	{
		accessorKey: "analytics",
		header: "Analytics",
		cell: ({ row }) => <AgentAnalayticsDrawer studentId={row.original.studentId} />,
	},
	{
		accessorKey: "actions",
		header: "Actions",
		cell: ({ row }) => (
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="ghost"
						className="data-[state=open]:bg-muted text-muted-foreground flex size-8 cursor-pointer"
						size="icon"
					>
						<MoreVertical />
						<span className="sr-only">Open menu</span>
					</Button>
				</PopoverTrigger>
				<PopoverContent align="end" className="max-w-32">
					<div className="flex flex-col gap-4">
						<Button
							type="button"
							variant="ghost"
							className="cursor-pointer"
							asChild
						>
							<Link
								to={href("/dashboard/agents/:studentId/edit", {
									studentId: row.original.studentId,
								})}
							>
								Edit
							</Link>
						</Button>
						<DropdownMenuSeparator />
						{!row.original.isActivated ? (
							<ActivateStudent studentId={row.original.studentId} />
						) : (
							<DeactivateStudent studentId={row.original.studentId} />
						)}
						<DropdownMenuSeparator />
						<DeleteDialog
							title="Delete Student"
							description={
								<div className="text-sm text-gray-500">
									Are you sure you want to delete this student?
									<br />
									This action cannot be undone.
								</div>
							}
							resourceRoute="/resource/student"
							hiddenInputs={[
								{ name: "studentId", value: row.original.studentId },
								{ name: "intent", value: "delete-student" },
							]}
							trigger={
								<Button
									type="button"
									variant="ghost"
									className="cursor-pointer text-red-500"
								>
									Delete
								</Button>
							}
						/>
					</div>
				</PopoverContent>
			</Popover>
			// <div className='flex items-center gap-2'>

			// </div>
		),
	},
];

export function DataTable({ initialData }: { initialData: Student[] }) {
	const [rowSelection, setRowSelection] = React.useState({});
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [pagination, setPagination] = React.useState({
		pageIndex: 0,
		pageSize: 8,
	});

	const table = useReactTable({
		data: initialData,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
			pagination,
		},
		getRowId: (row) => row.id.toString(),
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
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
					<CreateStudent />
					{/* Add student button */}
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
															header.getContext(),
														)}
											</TableHead>
										);
									})}
								</TableRow>
							))}
						</TableHeader>
						<TableBody className="**:data-[slot=table-cell]:first:w-8">
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
										No results.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>
			{/* Pagination */}
			<div className="flex items-center justify-between px-4">
				<div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
					{table.getFilteredSelectedRowModel().rows.length} of{" "}
					{table.getFilteredRowModel().rows.length} row(s) selected.
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
		</div>
	);
}
