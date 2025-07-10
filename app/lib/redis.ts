import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
if (
	!process.env.UPSTASH_REDIS_REST_URL ||
	!process.env.UPSTASH_REDIS_REST_TOKEN
) {
	throw new Error("Redis credentials are not configured");
}

export const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL,
	token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const ratelimit = new Ratelimit({
	redis,
	// 2 requests per minute from the same IP address in a sliding window of 1 minute duration which means that the window slides forward every second and the rate limit is reset every minute for each IP address.
	limiter: Ratelimit.slidingWindow(2, "1 m"),
});
