import { kv } from '@vercel/kv'
import { NextRequest } from 'next/server';

const RATE_LIMITS: Record<string, { requests: number; window: string }> = {
  '/api/auth/login': { requests: 5, window: '15m' },
  '/api/auth/register': { requests: 3, window: '1h' },
  '/api/tasks': { requests: 100, window: '1h' },
  '/api/sessions': { requests: 200, window: '1h' },
  '/api/spotify': { requests: 50, window: '1h' },
  default: { requests: 1000, window: '1h' }
};

// ✅ Helper function
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export async function rateLimit(req: NextRequest) {
  const ip = getClientIp(req); // ✅ Use helper here
  const route = req.nextUrl.pathname;
  
  const config = RATE_LIMITS[route] || RATE_LIMITS.default;
  const key = `rate_limit:${ip}:${route}`;
  
  try {
    const current = await kv.incr(key);
    
    if (current === 1) {
      await kv.expire(key, getWindowSeconds(config.window));
    }
    
    return {
      success: current <= config.requests,
      remaining: Math.max(0, config.requests - current),
      resetTime: Date.now() + getWindowSeconds(config.window) * 1000
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    return { success: true, remaining: config.requests, resetTime: Date.now() };
  }
}

function getWindowSeconds(window: string): number {
  const match = window.match(/^(\d+)([smh])$/);
  if (!match) return 3600;
  
  const [, amount, unit] = match;
  const multipliers = { s: 1, m: 60, h: 3600 };
  
  return parseInt(amount) * multipliers[unit as keyof typeof multipliers];
}

// import { kv } from '@vercel/kv'
// import { NextRequest } from 'next/server';


// // const RATE_LIMITS = {
// //   '/api/auth/login': { requests: 5, window: '15m' },
// //   '/api/auth/register': { requests: 3, window: '1h' },
// //   '/api/tasks': { requests: 100, window: '1h' },
// //   '/api/sessions': { requests: 200, window: '1h' },
// //   '/api/spotify': { requests: 50, window: '1h' },
// //   'default': { requests: 1000, window: '1h' }
// // }

// const RATE_LIMITS: Record<string, { requests: number; window: string }> = {
//   '/api/auth/login': { requests: 5, window: '15m' },
//   '/api/auth/register': { requests: 3, window: '1h' },
//   '/api/tasks': { requests: 100, window: '1h' },
//   '/api/sessions': { requests: 200, window: '1h' },
//   '/api/spotify': { requests: 50, window: '1h' },
//   default: { requests: 1000, window: '1h' }
// };

// export async function rateLimit(req: NextRequest) {
//   const ip = req.ip ?? 'anonymous'
//   const route = req.nextUrl.pathname
  
//   // Get rate limit config for this route
//   const config = RATE_LIMITS[route] || RATE_LIMITS.default
  
//   // Create a key for this IP and route
//   const key = `rate_limit:${ip}:${route}`
  
//   try {
//     const current = await kv.incr(key)
    
//     if (current === 1) {
//       // First request, set expiration
//       await kv.expire(key, getWindowSeconds(config.window))
//     }
    
//     return {
//       success: current <= config.requests,
//       remaining: Math.max(0, config.requests - current),
//       resetTime: Date.now() + getWindowSeconds(config.window) * 1000
//     }
//   } catch (error) {
//     // If Redis is down, allow the request
//     console.error('Rate limiting error:', error)
//     return { success: true, remaining: config.requests, resetTime: Date.now() }
//   }
// }

// function getWindowSeconds(window: string): number {
//   const match = window.match(/^(\d+)([smh])$/)
//   if (!match) return 3600 // default to 1 hour
  
//   const [, amount, unit] = match
//   const multipliers = { s: 1, m: 60, h: 3600 }
  
//   return parseInt(amount) * multipliers[unit as keyof typeof multipliers]
// }