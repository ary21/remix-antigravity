import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, Form, useNavigation, useActionData, useSubmit } from "react-router";
import { prisma } from "~/utils/db.server";
import { requireUserId } from "~/utils/auth.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

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
import { type ColumnDef } from "@tanstack/react-table";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DataTable } from "~/components/data-table";

// ... (imports)

export async function loader({ request }: LoaderFunctionArgs) {
    console.log("Customers Loader: Start");
    await requireUserId(request);
    const customers = await prisma.customer.findMany({
        orderBy: { createdAt: "desc" },
    });
    console.log("Customers Loader: Found", customers.length, "customers");
    return { customers };
}

export async function action({ request }: ActionFunctionArgs) {
    await requireUserId(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "bulk-delete") {
        const idsString = formData.get("ids") as string;
        try {
            const ids = JSON.parse(idsString);
            if (Array.isArray(ids) && ids.length > 0) {
                await prisma.customer.deleteMany({
                    where: { id: { in: ids } }
                });
                return { success: true, message: `${ids.length} customers deleted successfully` };
            }
        } catch (e) {
            return { error: "Invalid bulk delete request" };
        }
        return { error: "No items selected" };
    }

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
    const data = useLoaderData<typeof loader>();
    console.log("Customers Component: Data", data);

    if (!data || !data.customers) {
        return <div className="p-4">Loading or Error... (Check console)</div>;
    }

    const { customers } = data;
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const submit = useSubmit();
    const isSubmitting = navigation.state === "submitting";

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

    const getDefaultValue = (field: string) => {
        if (sheetMode === "create") return "";
        if (!selectedCustomer) return "";
        const value = selectedCustomer[field] || "";
        return sheetMode === "duplicate" ? `CLONE - ${value}` : value;
    };

    return (
        <div className="w-full">
            <DataTable columns={columns} data={customers} filterColumn="name">
                <Button onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Add Customer
                </Button>
            </DataTable>

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
