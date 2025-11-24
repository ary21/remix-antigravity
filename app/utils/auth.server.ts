import { redirect } from "react-router";
import bcrypt from "bcryptjs";
import { prisma } from "./db.server";
import { getSession, commitSession, destroySession, sessionStorage } from "./session.server";

export async function register({ email, password }: { email: string; password: string }) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return { error: "User already exists with that email" };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: { email, passwordHash },
    });
    return { user };
}

export async function login({ email, password }: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    const isCorrectPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isCorrectPassword) return null;

    return user;
}

export async function createUserSession(userId: string, redirectTo: string) {
    const session = await getSession();
    session.set("userId", userId);
    return redirect(redirectTo, {
        headers: {
            "Set-Cookie": await commitSession(session),
        },
    });
}

export async function getUserId(request: Request) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");
    if (!userId || typeof userId !== "string") return null;
    return userId;
}

export async function getUser(request: Request) {
    const userId = await getUserId(request);
    if (!userId) return null;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, createdAt: true },
        });
        return user;
    } catch {
        throw logout(request);
    }
}

export async function requireUserId(request: Request, redirectTo: string = new URL(request.url).pathname) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");
    if (!userId || typeof userId !== "string") {
        const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
        throw redirect(`/login?${searchParams}`);
    }
    return userId;
}

export async function logout(request: Request) {
    const session = await getSession(request.headers.get("Cookie"));
    return redirect("/", {
        headers: {
            "Set-Cookie": await destroySession(session),
        },
    });
}
