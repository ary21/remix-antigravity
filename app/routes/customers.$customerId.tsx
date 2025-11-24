import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, Form, useNavigation, redirect, useActionData } from "react-router";
import { prisma } from "~/utils/db.server";
import { requireUserId } from "~/utils/auth.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export async function loader({ request, params }: LoaderFunctionArgs) {
    await requireUserId(request);
    const customer = await prisma.customer.findUnique({
        where: { id: params.customerId },
    });

    if (!customer) {
        throw new Response("Not Found", { status: 404 });
    }

    return { customer };
}

export async function action({ request, params }: ActionFunctionArgs) {
    await requireUserId(request);
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;

    if (!name || !email) {
        return { error: "Name and Email are required" };
    }

    // Check if email is taken by another customer
    const existing = await prisma.customer.findFirst({
        where: {
            email,
            id: { not: params.customerId }
        }
    });

    if (existing) {
        return { error: "Email already exists" };
    }

    await prisma.customer.update({
        where: { id: params.customerId },
        data: { name, email, phone, address },
    });

    return redirect("/customers");
}

export default function EditCustomer() {
    const { customer } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    return (
        <div className="flex justify-center py-10">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Edit Customer</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form method="post" className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={customer.name}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                defaultValue={customer.email}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                name="phone"
                                defaultValue={customer.phone}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                name="address"
                                defaultValue={customer.address}
                            />
                        </div>
                        {actionData?.error && (
                            <div className="text-sm text-red-500 font-medium">
                                {actionData.error}
                            </div>
                        )}
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => history.back()}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
