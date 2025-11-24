import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, Form, useNavigation, useActionData, useSubmit } from "react-router";
import { prisma } from "~/utils/db.server";
import { requireUserId } from "~/utils/auth.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose,
} from "~/components/ui/sheet";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Label } from "~/components/ui/label";
import { Plus, MoreHorizontal, Copy, Pencil, Trash } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getFilteredRowModel,
    type ColumnFiltersState,
} from "@tanstack/react-table";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export async function loader({ request }: LoaderFunctionArgs) {
    await requireUserId(request);
    const customers = await prisma.customer.findMany({
        orderBy: { createdAt: "desc" },
    });
    return { customers };
}

export async function action({ request }: ActionFunctionArgs) {
    await requireUserId(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "create" || intent === "update") {
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const address = formData.get("address") as string;
        const phone = formData.get("phone") as string;
        const customerId = formData.get("customerId") as string;

        if (!name || !email) return { error: "Name and Email are required" };

        // Check for existing email (exclude current customer if updating)
        const existing = await prisma.customer.findFirst({
            where: {
                email,
                id: intent === "update" ? { not: customerId } : undefined
            }
        });

        if (existing) return { error: "Email already exists" };

        if (intent === "update") {
            await prisma.customer.update({
                where: { id: customerId },
                data: { name, email, address, phone }
            });
            return { success: true, message: "Customer updated successfully" };
        } else {
            await prisma.customer.create({ data: { name, email, address, phone } });
            return { success: true, message: "Customer created successfully" };
        }
    }

    if (intent === "delete") {
        const customerId = formData.get("customerId") as string;
        await prisma.customer.delete({ where: { id: customerId } });
        return { success: true, message: "Customer deleted successfully" };
    }

    return null;
}

export default function Customers() {
    const { customers } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const submit = useSubmit();
    const isSubmitting = navigation.state === "submitting";

    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [sheetMode, setSheetMode] = useState<"create" | "edit" | "duplicate">("create");
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<any>(null);

    // Handle Toast Notifications
    useEffect(() => {
        if (actionData) {
            if (actionData.error) {
                toast.error(actionData.error);
            } else if (actionData.success) {
                toast.success(actionData.message);
                setIsSheetOpen(false);
                setIsDeleteDialogOpen(false);
            }
        }
    }, [actionData]);

    const openCreate = () => {
        setSheetMode("create");
        setSelectedCustomer(null);
        setIsSheetOpen(true);
    };

    const openEdit = (customer: any) => {
        setSheetMode("edit");
        setSelectedCustomer(customer);
        setIsSheetOpen(true);
    };

    const openDuplicate = (customer: any) => {
        setSheetMode("duplicate");
        setSelectedCustomer(customer);
        setIsSheetOpen(true);
    };

    const openDelete = (customer: any) => {
        setCustomerToDelete(customer);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = () => {
        if (customerToDelete) {
            const formData = new FormData();
            formData.append("intent", "delete");
            formData.append("customerId", customerToDelete.id);
            submit(formData, { method: "post" });
        }
    };

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "name",
            header: "Name",
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
            accessorKey: "address",
            header: "Address",
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const customer = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEdit(customer)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDuplicate(customer)}>
                                <Copy className="mr-2 h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDelete(customer)} className="text-red-600">
                                <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const table = useReactTable({
        data: customers,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            columnFilters,
        },
    });

    // Helper to get default values based on mode
    const getDefaultValue = (field: string) => {
        if (sheetMode === "create") return "";
        if (!selectedCustomer) return "";
        const value = selectedCustomer[field] || "";
        return sheetMode === "duplicate" ? `CLONE - ${value}` : value;
    };

    return (
        <div className="w-full">
            <div className="flex items-center py-4 justify-between">
                <Input
                    placeholder="Filter names..."
                    value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("name")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <Button onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Add Customer
                </Button>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
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
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
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
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
            </div>

            {/* Add/Edit/Duplicate Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>
                            {sheetMode === "create" && "Add New Customer"}
                            {sheetMode === "edit" && "Edit Customer"}
                            {sheetMode === "duplicate" && "Duplicate Customer"}
                        </SheetTitle>
                        <SheetDescription>
                            {sheetMode === "create" && "Add a new customer to your database."}
                            {sheetMode === "edit" && "Make changes to the customer details."}
                            {sheetMode === "duplicate" && "Create a copy of an existing customer."}
                        </SheetDescription>
                    </SheetHeader>
                    <Form method="post" className="grid gap-4 py-4">
                        <input type="hidden" name="customerId" value={selectedCustomer?.id || ""} />
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" name="name" defaultValue={getDefaultValue("name")} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">Email</Label>
                            <Input id="email" name="email" type="email" defaultValue={getDefaultValue("email")} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">Phone</Label>
                            <Input id="phone" name="phone" defaultValue={getDefaultValue("phone")} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address" className="text-right">Address</Label>
                            <Input id="address" name="address" defaultValue={getDefaultValue("address")} className="col-span-3" />
                        </div>
                        <SheetFooter>
                            <Button type="submit" name="intent" value={sheetMode === "edit" ? "update" : "create"} disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : "Save changes"}
                            </Button>
                        </SheetFooter>
                    </Form>
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the customer
                            "{customerToDelete?.name}" and remove their data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
