import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DEFAULT_BACKEND_HEALTH_URL = 'https://kda-km8t.onrender.com/health';

export async function GET() {
  let healthUrl = 'https://kda-km8t.onrender.com/health';

  const rawBackend =
    process.env.INTERNAL_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL;

  if (rawBackend && !rawBackend.includes('localhost') && !rawBackend.includes('127.0.0.1')) {
    let resolved = rawBackend.trim().replace(/\/api\/v1\/?$/, '');
    if (resolved.includes('kda-backend.onrender.com')) {
      resolved = resolved.replace('kda-backend.onrender.com', 'kda-km8t.onrender.com');
    }
    if (resolved.startsWith('http')) {
      healthUrl = `${resolved}/health`;
    }
  }

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(healthUrl, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'User-Agent': 'KDA-KeepAlive/1.0',
      },
    });
    clearTimeout(timeoutId);

    const duration = Date.now() - startTime;
    const data = await res.json().catch(() => ({}));

    return NextResponse.json(
      {
        status: 'ok',
        warmed: true,
        responseTimeMs: duration,
        backend: data,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  } catch (err: any) {
    const duration = Date.now() - startTime;
    return NextResponse.json(
      {
        status: 'warming_up',
        warmed: false,
        responseTimeMs: duration,
        error: err.message || 'Health check timed out or failed',
        timestamp: new Date().toISOString(),
      },
      {
        status: 200, // Return 200 so cron monitoring doesn't trigger false hard failure while warming
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  }
}
