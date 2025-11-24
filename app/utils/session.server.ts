import { createCookieSessionStorage } from "react-router";

const sessionSecret = process.env.SESSION_SECRET || "default-secret-change-me";

export const sessionStorage = createCookieSessionStorage({
    cookie: {
        name: "_session",
        sameSite: "lax",
        path: "/",
        httpOnly: true,
        secrets: [sessionSecret],
        secure: process.env.NODE_ENV === "production",
    },
});

export const { getSession, commitSession, destroySession } = sessionStorage;
