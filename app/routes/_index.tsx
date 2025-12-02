import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { Form, Link, useActionData, useNavigation, redirect } from "react-router";
import { login, createUserSession, getUserId, LoginSchema } from "~/utils/auth.server";
import { isRateLimited } from "~/utils/rate-limit.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export const meta: MetaFunction = () => {
    return [{ title: "Login - Remix User Management" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
    const userId = await getUserId(request);
    if (userId) return redirect("/users");
    return null;
}

export async function action({ request }: ActionFunctionArgs) {
    const ip = request.headers.get("X-Forwarded-For") || "unknown";
    if (isRateLimited(ip, 5, 60 * 1000)) {
        return { error: "Too many login attempts. Please try again later." };
    }

    const formData = await request.formData();
    const result = LoginSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    const { email, password } = result.data;

    const user = await login({ email, password });
    if (!user) {
        return { error: "Invalid email or password" };
    }

    return createUserSession(user.id, "/users");
}

export default function LoginPage() {
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    return (
        <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
            <div className="flex items-center justify-center py-12">
                <div className="mx-auto grid w-[350px] gap-6">
                    <div className="grid gap-2 text-center">
                        <h1 className="text-3xl font-bold">Login</h1>
                        <p className="text-balance text-muted-foreground">
                            Enter your email below to login to your account
                        </p>
                    </div>
                    <Form method="post" className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                                <Link
                                    to="#"
                                    className="ml-auto inline-block text-sm underline"
                                >
                                    Forgot your password?
                                </Link>
                            </div>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        {actionData?.error && (
                            <div className="text-sm text-red-500 font-medium">
                                {actionData.error}
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Logging in..." : "Login"}
                        </Button>
                        <Button variant="outline" className="w-full" type="button">
                            Login with Google
                        </Button>
                    </Form>
                    <div className="mt-4 text-center text-sm">
                        Don&apos;t have an account?{" "}
                        <Link to="/register" className="underline">
                            Sign up
                        </Link>
                    </div>
                </div>
            </div>
            <div className="hidden bg-muted lg:block">
                <img
                    src="https://ui.shadcn.com/placeholder.svg"
                    alt="Image"
                    width="1920"
                    height="1080"
                    className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                />
            </div>
        </div>
    );
}
