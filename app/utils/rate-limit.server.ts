type RateLimitEntry = {
    count: number;
    expiresAt: number;
};

const rateLimitMap = new Map<string, RateLimitEntry>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || entry.expiresAt < now) {
        rateLimitMap.set(key, { count: 1, expiresAt: now + windowMs });
        return false;
    }

    if (entry.count >= limit) {
        return true;
    }

    entry.count++;
    return false;
}

// Cleanup periodically to prevent memory leaks
if (process.env.NODE_ENV !== "test") {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of rateLimitMap.entries()) {
            if (entry.expiresAt < now) {
                rateLimitMap.delete(key);
            }
        }
    }, 60000);
}
