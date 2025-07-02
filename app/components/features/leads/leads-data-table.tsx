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
import { useEffect, useState } from "react";
import { Link, href } from "react-router";
import { Badge } from "~/components/ui/badge";
import { DeleteDialog } from "~/components/global/admin/delete-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import PrimaryButton from "~/components/global/brand/primary-button";
import EmailDomainInput from "~/components/features/students/email-domain-input";
import { AssignAgentsToTeamLeader } from "~/components/features/team-leaders/assign-agents-to-team-leader";
import { generateRandomPassword } from "~/lib/utils";
import { 
	promoteLeadSchema, 
	type PromoteLeadSchemaType 
} from "~/lib/zod-schemas/lead-capture";

import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
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
import type { LeadCapture } from "~/db/schema";
import { formatDateToString } from "~/lib/utils";

// Submitted State Component
function PromoteSubmittedState({
	email,
	password,
	userType,
	setHasCopied,
}: {
	email: string;
	password: string;
	userType: string;
	setHasCopied: (hasCopied: boolean) => void;
}) {
	return (
		<DialogContent className="flex flex-col gap-8">
			<DialogHeader>
				<DialogTitle>{userType === "team-leader" ? "Team Leader" : "Agent"} Created</DialogTitle>
			</DialogHeader>
			<div className="flex flex-col gap-2">
				<p>Email: {email}</p>
				<p>Password: {password}</p>
			</div>
			<Button
				variant={"outline"}
				className="cursor-pointer"
				onClick={() => {
					navigator.clipboard.writeText(
						`Email: ${email}\nPassword: ${password}`,
					);
					setHasCopied(true);
				}}
			>
				Copy to Clipboard
			</Button>
		</DialogContent>
	);
}

// Promote Dialog Component
function PromoteDialog({ leadData }: { leadData: LeadCapture }) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [hasCopied, setHasCopied] = useState(false);
	const fetcher = useFetcher();

    
	const form = useForm<PromoteLeadSchemaType>({
        resolver: zodResolver(promoteLeadSchema),
		defaultValues: {
            leadId: leadData.id,
			userType: "agent",
			name: `${leadData.firstName} ${leadData.lastName}`,
			email: "",
			phoneNumber: leadData.phoneNumber ?? "",
			password: generateRandomPassword(),
			agents: [],
		},
	});
    
    const isSubmitting = fetcher.state !== "idle";
	const watchedUserType = form.watch("userType");

	useEffect(() => {
		if (fetcher.data) {
			if (fetcher.data.success) {
				setIsSubmitted(true);
			}
			if (!fetcher.data.success) {
			}
		}
	}, [fetcher.data]);

	useEffect(() => {
		// Reset form when dialog closes
		if (!isDialogOpen) {
			form.reset();
			setIsSubmitted(false);
		}
	}, [isDialogOpen, form]);

	useEffect(() => {
		if (hasCopied) {
			toast.success("Copied to clipboard");
			setHasCopied(false);
		}
	}, [hasCopied]);

	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogTrigger asChild>
				<Button type="button" variant="ghost" className="cursor-pointer">
					Promote
				</Button>
			</DialogTrigger>
			{isSubmitted ? (
				<PromoteSubmittedState
					email={form.getValues("email")}
					password={form.getValues("password")}
					userType={form.getValues("userType")}
					setHasCopied={setHasCopied}
				/>
			) : (
				<DialogContent className="flex flex-col gap-8 max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Promote Lead</DialogTitle>
						<DialogDescription>
							Promote this lead to an agent or team leader in the system.
						</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<fetcher.Form
							method="POST"
							action="/resource/lead-capture"
							className="flex flex-col gap-4 w-full"
							onSubmit={form.handleSubmit((data) => {
								fetcher.submit(
									{ ...data, intent: "promote-lead" },
									{
										action: "/resource/lead-capture",
										method: "POST",
									},
								);
							})}
						>
							<FormField
								control={form.control}
								name="userType"
								disabled={isSubmitting}
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>
											User Type <span className="text-xs text-red-500">*</span>
										</FormLabel>
										<FormControl>
											<Select
												value={field.value}
												onValueChange={field.onChange}
												disabled={isSubmitting}
											>
												<SelectTrigger className="bg-white text-black focus-visible:ring-0 focus-visible:ring-offset-0 w-full">
													<SelectValue placeholder="Select user type" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="agent">Agent</SelectItem>
													<SelectItem value="team-leader">Team Leader</SelectItem>
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

{watchedUserType === "team-leader" && (
								<FormField
									control={form.control}
									name="agents"
									disabled={isSubmitting}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Agents{" "}
												<span className="text-xs text-gray-500">(optional)</span>
											</FormLabel>
											<FormControl>
												<AssignAgentsToTeamLeader form={form} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							<FormField
								control={form.control}
								name="name"
								disabled={isSubmitting}
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Name <span className="text-xs text-red-500">*</span>
										</FormLabel>
										<FormControl>
											<Input
												placeholder={`Enter ${watchedUserType === "team-leader" ? "team leader" : "agent"} name`}
												type="text"
												className="bg-white text-black focus-visible:ring-0 focus-visible:ring-offset-0"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="phoneNumber"
								disabled={isSubmitting}
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Phone Number{" "}
											<span className="text-xs text-gray-500">(optional)</span>
										</FormLabel>
										<FormControl>
											<Input
												placeholder={`Enter ${watchedUserType === "team-leader" ? "team leader" : "agent"} phone number`}
												type="tel"
												className="bg-white text-black focus-visible:ring-0 focus-visible:ring-offset-0"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="email"
								disabled={isSubmitting}
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Email <span className="text-xs text-red-500">*</span>
										</FormLabel>
										<FormControl>
											<EmailDomainInput
												placeholder={`Enter ${watchedUserType === "team-leader" ? "team leader" : "agent"} username`}
												value={field.value}
												onChange={field.onChange}
												disabled={isSubmitting}
												className="bg-white text-black focus-visible:ring-0 focus-visible:ring-offset-0"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

						

							<PrimaryButton type="submit" disabled={isSubmitting}>
								{isSubmitting 
									? `Promoting to ${watchedUserType === "team-leader" ? "Team Leader" : "Agent"}...` 
									: `Promote to ${watchedUserType === "team-leader" ? "Team Leader" : "Agent"}`
								}
							</PrimaryButton>
						</fetcher.Form>
					</Form>
				</DialogContent>
			)}
		</Dialog>
	);
}

const columns: ColumnDef<LeadCapture>[] = [
	{
		accessorKey: "firstName",
		header: "First Name",
		enableHiding: false,
	},
	{
		accessorKey: "lastName",
		header: "Last Name",
	},
	{
		accessorKey: "email",
		header: "Email",
	},
	{
		accessorKey: "phoneNumber",
		header: "Phone",
	},
	{
		accessorKey: "stateOfResidence",
		header: "State",
	},
	{
		id: "Lead Status",
		accessorKey: "leadStatus",
		header: "Status",
		cell: ({ row }) => (
			<Badge 
				variant={row.original.leadStatus === "promoted" ? "default" : "secondary"}
				className={row.original.leadStatus === "promoted" ? "bg-brand-primary hover:bg-brand-primary/80" : "bg-yellow-500 hover:bg-yellow-600 text-white"}
			>
				{row.original.leadStatus === "promoted" ? "Promoted" : "Pending"}
			</Badge>
		),
	},
	{
		id: "Over 18",
		accessorKey: "areYouOver18",
		header: "Over 18",
		cell: ({ row }) => (
			<Badge variant={row.original.areYouOver18 ? "default" : "destructive"}>
				{row.original.areYouOver18 ? "Yes" : "No"}
			</Badge>
		),
	},
	{
		id: "Felonies",
		accessorKey: "doYouHaveAnyFeloniesOrMisdemeanors",
		header: "No Felonies",
		cell: ({ row }) => (
			<Badge variant={!row.original.doYouHaveAnyFeloniesOrMisdemeanors ? "destructive" : "default"}>
				{!row.original.doYouHaveAnyFeloniesOrMisdemeanors ? "Yes" : "No"}
			</Badge>
		),
	},
	{
		id: "Created at",
		accessorKey: "createdAt",
		header: "Created At",
		cell: ({ row }) => (
			<span className="text-muted-foreground">
				{formatDateToString(row.original.createdAt)}
			</span>
		),
	},
	{
		accessorKey: "actions",
		header: "Actions",
		cell: ({ row }) => 
			row.original.leadStatus === "promoted" ? (
				<span className="text-green-600 font-medium">Promoted!</span>
			) : (
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
							<PromoteDialog leadData={row.original} />
						</div>
					</PopoverContent>
				</Popover>
			),
	},
];

export function LeadsDataTable({ initialData }: { initialData: any }) {
	const [data, setData] = React.useState(initialData);
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
		data,
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
					{/* Leads don't need a create button since they come from the lead capture form */}
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