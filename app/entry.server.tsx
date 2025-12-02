import { PassThrough } from "node:stream";
import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { env } from "./env.server";

export const streamTimeout = 5_000;

export default function handleRequest(
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    routerContext: EntryContext,
    loadContext: AppLoadContext
) {
    return new Promise((resolve, reject) => {
        let shellRendered = false;
        const userAgent = request.headers.get("user-agent");

        // Ensure requests from bots and SPA client side navigation wait for all content to load before responding
        // This is important for SEO and ensuring that the client side hydration works correctly
        const readyOption = (userAgent && isbot(userAgent)) || routerContext.isSpaMode
            ? "onAllReady"
            : "onShellReady";

        const { pipe, abort } = renderToPipeableStream(
            <ServerRouter context={routerContext} url={request.url} />,
            {
                [readyOption]() {
                    shellRendered = true;
                    const body = new PassThrough();
                    const stream = createReadableStreamFromReadable(body);

                    responseHeaders.set("Content-Type", "text/html");

                    // Security Headers
                    responseHeaders.set("X-Frame-Options", "DENY");
                    responseHeaders.set("X-Content-Type-Options", "nosniff");
                    responseHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
                    responseHeaders.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

                    if (env.NODE_ENV === "production") {
                        responseHeaders.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self';");
                    }

                    resolve(
                        new Response(stream, {
                            headers: responseHeaders,
                            status: responseStatusCode,
                        })
                    );

                    pipe(body);
                },
                onShellError(error: unknown) {
                    reject(error);
                },
                onError(error: unknown) {
                    responseStatusCode = 500;
                    if (shellRendered) {
                        console.error(error);
                    }
                },
            }
        );

        setTimeout(abort, streamTimeout + 1000);
    });
}
