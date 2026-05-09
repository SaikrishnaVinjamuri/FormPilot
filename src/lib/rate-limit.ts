import { redis } from "./redis";

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds = 60
): Promise<{ allowed: boolean; remaining: number }> {
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }
  const remaining = Math.max(0, limit - current);
  return { allowed: current <= limit, remaining };
}
