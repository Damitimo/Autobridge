import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis client
const redisClient = createClient({
  url: REDIS_URL,
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

// Connect to Redis
let isConnected = false;

async function connectRedis() {
  if (!isConnected) {
    await redisClient.connect();
    isConnected = true;
  }
}

// Auto-connect when module is imported
connectRedis().catch(console.error);

export { redisClient };

// Cache utilities
export async function cacheSet(key: string, value: any, expirySeconds?: number): Promise<void> {
  const serialized = JSON.stringify(value);
  if (expirySeconds) {
    await redisClient.setEx(key, expirySeconds, serialized);
  } else {
    await redisClient.set(key, serialized);
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const cached = await redisClient.get(key);
  if (!cached) return null;
  return JSON.parse(cached) as T;
}

export async function cacheDelete(key: string): Promise<void> {
  await redisClient.del(key);
}

export async function cacheClear(pattern: string): Promise<void> {
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
}

// Session management
export async function setSession(userId: string, token: string, expirySeconds: number = 604800): Promise<void> {
  await redisClient.setEx(`session:${userId}`, expirySeconds, token);
}

export async function getSession(userId: string): Promise<string | null> {
  return await redisClient.get(`session:${userId}`);
}

export async function deleteSession(userId: string): Promise<void> {
  await redisClient.del(`session:${userId}`);
}

// OTP management
export async function setOTP(identifier: string, otp: string, expirySeconds: number = 600): Promise<void> {
  await redisClient.setEx(`otp:${identifier}`, expirySeconds, otp);
}

export async function getOTP(identifier: string): Promise<string | null> {
  return await redisClient.get(`otp:${identifier}`);
}

export async function deleteOTP(identifier: string): Promise<void> {
  await redisClient.del(`otp:${identifier}`);
}

// Rate limiting
export async function checkRateLimit(identifier: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
  const key = `ratelimit:${identifier}`;
  const current = await redisClient.incr(key);
  
  if (current === 1) {
    await redisClient.expire(key, windowSeconds);
  }
  
  return current <= maxRequests;
}
