import { Outlet, useLocation, Link, redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireUserId } from "~/utils/auth.server";
import { AppSidebar } from "~/components/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "~/components/ui/sidebar";
import { Separator } from "~/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Toaster } from "sonner";

export async function loader({ request }: LoaderFunctionArgs) {
    await requireUserId(request);
    return null;
}

export default function AuthLayout() {
    const location = useLocation();
    const pathSegments = location.pathname.split("/").filter(Boolean);

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink asChild>
                                        <Link to="/users">Dashboard</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                {pathSegments.map((segment, index) => {
                                    const isLast = index === pathSegments.length - 1;
                                    const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
                                    return (
                                        <div key={path} className="flex items-center">
                                            <BreadcrumbSeparator className="hidden md:block" />
                                            <BreadcrumbItem>
                                                {isLast ? (
                                                    <BreadcrumbPage className="capitalize">{segment}</BreadcrumbPage>
                                                ) : (
                                                    <BreadcrumbLink asChild>
                                                        <Link to={path} className="capitalize">
                                                            {segment}
                                                        </Link>
                                                    </BreadcrumbLink>
                                                )}
                                            </BreadcrumbItem>
                                        </div>
                                    );
                                })}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <Outlet />
                </div>
            </SidebarInset>
            <Toaster />
        </SidebarProvider>
    );
}
