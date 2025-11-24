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
import { Plus, MoreHorizontal, Pencil, Copy, Trash } from "lucide-react";
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
import bcrypt from "bcryptjs";
import { toast } from "sonner";
import { DataTable } from "~/components/data-table";

export async function loader({ request }: LoaderFunctionArgs) {
    await requireUserId(request);
    const users = await prisma.user.findMany({
        select: { id: true, email: true, createdAt: true },
        orderBy: { createdAt: "desc" },
    });
    return { users };
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
                await prisma.user.deleteMany({
                    where: { id: { in: ids } }
                });
                return { success: true, message: `${ids.length} users deleted successfully` };
            }
        } catch (e) {
            return { error: "Invalid bulk delete request" };
        }
        return { error: "No items selected" };
    }

    if (intent === "create" || intent === "update") {
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const userId = formData.get("userId") as string;

        if (!email) return { error: "Email is required" };
        if (intent === "create" && !password) return { error: "Password is required" };

        // Check for existing email
        const existing = await prisma.user.findUnique({
            where: { email },
        });

        // If updating, allow same email if it belongs to current user
        if (existing && (intent === "create" || existing.id !== userId)) {
            return { error: "Email already exists" };
        }

        if (intent === "update") {
            const data: any = { email };
            if (password) {
                data.passwordHash = await bcrypt.hash(password, 10);
            }
            await prisma.user.update({
                where: { id: userId },
                data,
            });
            return { success: true, message: "User updated successfully" };
        } else {
            const passwordHash = await bcrypt.hash(password, 10);
            await prisma.user.create({ data: { email, passwordHash } });
            return { success: true, message: "User created successfully" };
        }
    }

    if (intent === "delete") {
        const userId = formData.get("userId") as string;
        await prisma.user.delete({ where: { id: userId } });
        return { success: true, message: "User deleted successfully" };
    }

    return null;
}

export default function Users() {
    const { users } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const submit = useSubmit();
    const isSubmitting = navigation.state === "submitting";

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [sheetMode, setSheetMode] = useState<"create" | "edit" | "duplicate">("create");
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any>(null);

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
        setSelectedUser(null);
        setIsSheetOpen(true);
    };

    const openEdit = (user: any) => {
        setSheetMode("edit");
        setSelectedUser(user);
        setIsSheetOpen(true);
    };

    const openDuplicate = (user: any) => {
        setSheetMode("duplicate");
        setSelectedUser(user);
        setIsSheetOpen(true);
    };

    const openDelete = (user: any) => {
        setUserToDelete(user);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = () => {
        if (userToDelete) {
            const formData = new FormData();
            formData.append("intent", "delete");
            formData.append("userId", userToDelete.id);
            submit(formData, { method: "post" });
        }
    };

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "email",
            header: "Email",
        },
        {
            accessorKey: "createdAt",
            header: "Created At",
            cell: ({ row }) => {
                return new Date(row.getValue("createdAt")).toLocaleDateString();
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const user = row.original;
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
                            <DropdownMenuItem onClick={() => openEdit(user)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDuplicate(user)}>
                                <Copy className="mr-2 h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDelete(user)} className="text-red-600">
                                <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const getDefaultEmail = () => {
        if (sheetMode === "create") return "";
        if (!selectedUser) return "";
        return sheetMode === "duplicate" ? `clone-${selectedUser.email}` : selectedUser.email;
    };

    return (
        <div className="w-full">
            <DataTable columns={columns} data={users} filterColumn="email">
                <Button onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Add User
                </Button>
            </DataTable>

            {/* Add/Edit/Duplicate Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>
                            {sheetMode === "create" && "Add New User"}
                            {sheetMode === "edit" && "Edit User"}
                            {sheetMode === "duplicate" && "Duplicate User"}
                        </SheetTitle>
                        <SheetDescription>
                            {sheetMode === "create" && "Create a new user account."}
                            {sheetMode === "edit" && "Update user details."}
                            {sheetMode === "duplicate" && "Create a copy of an existing user."}
                        </SheetDescription>
                    </SheetHeader>
                    <Form method="post" className="grid gap-4 py-4">
                        <input type="hidden" name="userId" value={selectedUser?.id || ""} />
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Email
                            </Label>
                            <Input id="email" name="email" type="email" defaultValue={getDefaultEmail()} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password" className="text-right">
                                Password
                            </Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                className="col-span-3"
                                required={sheetMode !== "edit"}
                                placeholder={sheetMode === "edit" ? "Leave blank to keep current" : ""}
                            />
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
                            This action cannot be undone. This will permanently delete the user
                            account associated with "{userToDelete?.email}".
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
        </div >
    );
}
