import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_TARGET_BASE = 'https://kda-km8t.onrender.com/api/v1';

function getTargetBaseUrl(): string {
  let url =
    process.env.INTERNAL_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL;

  if (url && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    url = url.trim().replace(/\/+$/, '');
    if (url.includes('kda-backend.onrender.com')) {
      url = url.replace('kda-backend.onrender.com', 'kda-km8t.onrender.com');
    }
    if (!url.endsWith('/api/v1')) {
      url = `${url}/api/v1`;
    }
    return url;
  }
  return DEFAULT_TARGET_BASE;
}

// Determines if this path is a public catalog query that benefits from Vercel Edge caching
function isCacheableCatalogGet(pathStr: string, method: string): boolean {
  if (method !== 'GET') return false;
  return (
    pathStr.startsWith('products') ||
    pathStr.startsWith('banners') ||
    pathStr.startsWith('categories')
  );
}

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path.join('/');
  const search = req.nextUrl.search || '';
  const targetBase = getTargetBaseUrl();
  const targetUrl = `${targetBase}/${pathStr}${search}`;

  const method = req.method;
  const isCacheable = isCacheableCatalogGet(pathStr, method);

  // Copy necessary request headers
  const reqHeaders = new Headers();
  req.headers.forEach((value, key) => {
    // Avoid host header mismatch
    if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'content-length') {
      reqHeaders.set(key, value);
    }
  });

  const fetchOptions: RequestInit = {
    method,
    headers: reqHeaders,
  };

  // Add body for non-GET/HEAD methods
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('application/json') || contentType.includes('text/')) {
        fetchOptions.body = await req.text();
      } else {
        fetchOptions.body = await req.arrayBuffer();
      }
    } catch {
      // Body may be empty or already consumed
    }
  }

  // Edge caching configuration for public GET catalog requests
  if (isCacheable) {
    (fetchOptions as any).next = { revalidate: 120 }; // revalidate every 2 minutes
  } else {
    fetchOptions.cache = 'no-store';
  }

  try {
    const controller = new AbortController();
    const timeoutMs = isCacheable ? 45000 : 30000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    fetchOptions.signal = controller.signal;

    const res = await fetch(targetUrl, fetchOptions);
    clearTimeout(timeoutId);

    const resData = await res.arrayBuffer();
    const responseHeaders = new Headers();

    res.headers.forEach((val, key) => {
      // Don't forward transfer-encoding, content-encoding, or content-length
      const k = key.toLowerCase();
      if (k !== 'transfer-encoding' && k !== 'content-encoding' && k !== 'content-length') {
        responseHeaders.set(key, val);
      }
    });

    if (isCacheable && res.status >= 200 && res.status < 300) {
      // Instruct Vercel CDN Edge to cache for 5 minutes, serve stale up to 24h while revalidating
      responseHeaders.set(
        'Cache-Control',
        'public, s-maxage=300, stale-while-revalidate=86400',
      );
      responseHeaders.set('X-Edge-Cache-Status', 'CONFIGURED');
    }

    return new NextResponse(resData, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Backend request failed or timed out',
        message: err.message,
      },
      { status: 504 },
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const HEAD = handleProxy;
export const OPTIONS = handleProxy;
