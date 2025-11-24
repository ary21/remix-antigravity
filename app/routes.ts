import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
    index("routes/_index.tsx"),
    route("login", "routes/login.tsx"), // Keeping for backward compatibility or direct access
    route("register", "routes/register.tsx"),
    route("logout", "routes/logout.tsx"),

    layout("routes/_auth.tsx", [
        route("users", "routes/users._index.tsx"),
        route("customers", "routes/customers._index.tsx"),
    ]),
] satisfies RouteConfig;
