import type { ActionFunctionArgs, MetaFunction } from "react-router";
import { Form, Link, useActionData, useNavigation } from "react-router";
import { register, createUserSession, RegisterSchema } from "~/utils/auth.server";
import { isRateLimited } from "~/utils/rate-limit.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export const meta: MetaFunction = () => {
    return [{ title: "Register - Remix User Management" }];
};

export async function action({ request }: ActionFunctionArgs) {
    const ip = request.headers.get("X-Forwarded-For") || "unknown";
    if (isRateLimited(ip, 5, 60 * 1000)) {
        return { error: "Too many registration attempts. Please try again later." };
    }

    const formData = await request.formData();
    const validationResult = RegisterSchema.safeParse(Object.fromEntries(formData));

    if (!validationResult.success) {
        return { error: validationResult.error.issues[0].message };
    }

    const { email, password } = validationResult.data;

    const registerResult = await register({ email, password });
    if (registerResult.error) {
        return { error: registerResult.error };
    }

    if (!registerResult.user) {
        return { error: "Something went wrong" };
    }

    return createUserSession(registerResult.user.id, "/users");
}

export default function Register() {
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    return (
        <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
            <div className="flex items-center justify-center py-12">
                <div className="mx-auto grid w-[350px] gap-6">
                    <div className="grid gap-2 text-center">
                        <h1 className="text-3xl font-bold">Create an Account</h1>
                        <p className="text-balance text-muted-foreground">
                            Enter your email below to create your account
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
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        {actionData?.error && (
                            <div className="text-sm text-red-500 font-medium">
                                {actionData.error}
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Creating account..." : "Create account"}
                        </Button>
                    </Form>
                    <div className="mt-4 text-center text-sm">
                        Already have an account?{" "}
                        <Link to="/" className="underline">
                            Login
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
