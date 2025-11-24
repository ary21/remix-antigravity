import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { Form, Link, useLoaderData, useActionData, useNavigation, redirect } from "react-router";
import { prisma } from "~/utils/db.server";
import { requireUserId } from "~/utils/auth.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "~/components/ui/card";
import bcrypt from "bcryptjs";

export async function loader({ request, params }: LoaderFunctionArgs) {
    await requireUserId(request);
    const user = await prisma.user.findUnique({
        where: { id: params.userId },
    });

    if (!user) {
        throw new Response("User Not Found", { status: 404 });
    }

    return { user };
}

export async function action({ request, params }: ActionFunctionArgs) {
    await requireUserId(request);
    const formData = await request.formData();
    const email = formData.get("email");
    const password = formData.get("password");

    if (typeof email !== "string") {
        return { error: "Invalid form submission" };
    }

    const updateData: any = { email };

    if (password && typeof password === "string" && password.length >= 6) {
        updateData.passwordHash = await bcrypt.hash(password, 10);
    } else if (password && typeof password === "string" && password.length < 6) {
        return { error: "Password must be at least 6 characters" };
    }

    try {
        await prisma.user.update({
            where: { id: params.userId },
            data: updateData,
        });
    } catch (e) {
        return { error: "Email already in use or update failed" };
    }

    return redirect("/users");
}

export default function EditUser() {
    const { user } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Edit User</CardTitle>
                </CardHeader>
                <Form method="post">
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" defaultValue={user.email} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password (optional)</Label>
                            <Input id="password" name="password" type="password" placeholder="Leave blank to keep current" />
                        </div>
                        {actionData?.error && (
                            <div className="text-sm text-red-500 font-medium">{actionData.error}</div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button asChild variant="outline">
                            <Link to="/users">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </CardFooter>
                </Form>
            </Card>
        </div>
    );
}
