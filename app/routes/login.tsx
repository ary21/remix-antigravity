import type { ActionFunctionArgs, MetaFunction } from "react-router";
import { Form, Link, useActionData, useNavigation } from "react-router";
import { login, createUserSession, LoginSchema } from "~/utils/auth.server";
import { isRateLimited } from "~/utils/rate-limit.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";

export const meta: MetaFunction = () => {
    return [{ title: "Login - Remix User Management" }];
};

export async function action({ request }: ActionFunctionArgs) {
    const ip = request.headers.get("X-Forwarded-For") || "unknown";
    if (isRateLimited(ip, 5, 60 * 1000)) {
        return { error: "Too many login attempts. Please try again later." };
    }

    const formData = await request.formData();
    const redirectTo = (formData.get("redirectTo") as string) || "/";

    const result = LoginSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    const { email, password } = result.data;

    const user = await login({ email, password });
    if (!user) {
        return { error: "Invalid email or password" };
    }

    return createUserSession(user.id, redirectTo);
}

export default function Login() {
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <Form method="post">
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        {actionData?.error && (
                            <div className="text-sm text-red-500 font-medium">{actionData.error}</div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Logging in..." : "Login"}
                        </Button>
                        <div className="text-sm text-center text-gray-500">
                            Don't have an account?{" "}
                            <Link to="/register" className="text-blue-600 hover:underline">
                                Register
                            </Link>
                        </div>
                    </CardFooter>
                </Form>
            </Card>
        </div>
    );
}
