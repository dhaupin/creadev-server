/**
 * @creadev.org/server
 *
 * HTTP server utilities - Request/Response, middleware.
 *
 * EXAMPLES:
 * ```typescript
 * import { createServer, json, cors } from '@creadev.org/server';
 *
 * const app = createServer({ port: 3456 });
 * app.use(json());
 * app.get('/api', (req) => ({ ok: true }));
 * ```
 * ============================================================================
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ServerOptions {
  /** Port (default: 3456) */
  port?: number;
  /** Host (default: '0.0.0.0') */
  host?: string;
}

export interface Request {
  method: string;
  url: string;
  path: string;
  headers: Record<string, string>;
  body: unknown;
  query: Record<string, string>;
  params: Record<string, string>;
}

export interface Response {
  status: number;
  body: unknown;
  headers: Record<string, string>;
}

export type Handler = (req: Request) => Response | Promise<Response>;
export type Middleware = (req: Request, next: () => Response) => Response;

// ============================================================================
// MIDDLEWARE
// ============================================================================

/** JSON body parser middleware */
export function json(options?: { limit?: string }) {
  return function jsonMiddleware(req: Request): Response {
    try {
      if (req.body && typeof req.body === 'string') {
        req.body = JSON.parse(req.body);
      }
    } catch {
      return { status: 400, body: { error: 'Invalid JSON' }, headers: {} };
    }
    return { status: 200, body: null, headers: {} };
  };
}

/** CORS middleware */
export function cors(options?: { origin?: string }) {
  return function corsMiddleware(req: Request): Response {
    return {
      status: 204,
      body: null,
      headers: {
        'Access-Control-Allow-Origin': options?.origin ?? '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    };
  };
}

/** Security headers middleware */
export function helmet() {
  return function helmetMiddleware(_req: Request): Response {
    return {
      status: 204,
      body: null,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    };
  };
}

/** Rate limit middleware */
export function rateLimit(options: { maxRequests: number; windowMs: number }) {
  const requests = new Map<string, number[]>();
  const windowMs = options.windowMs;
  const maxRequests = options.maxRequests;

  return function rateLimitMiddleware(req: Request): Response | undefined {
    const now = Date.now();
    const key = req.path;
    const times = requests.get(key) ?? [];
    
    // Remove old requests outside window
    const valid = times.filter(t => now - t < windowMs);
    requests.set(key, valid);
    
    if (valid.length >= maxRequests) {
      return {
        status: 429,
        body: { error: 'Rate limit exceeded' },
        headers: {},
      };
    }
    
    valid.push(now);
    return undefined;
  };
}

// ============================================================================
// ROUTER
// ============================================================================

type RouteHandler = {
  handler: Handler;
  middleware: Middleware[];
};

export class Router {
  private routes: Map<string, RouteHandler>;
  private middleware: Middleware[];

  constructor() {
    this.routes = new Map();
    this.middleware = [];
  }

  /** Add middleware */
  use(fn: Middleware): this {
    this.middleware.push(fn);
    return this;
  }

  /** Add route */
  on(method: string, path: string, handler: Handler): this {
    this.routes.set(`${method}:${path}`, { handler, middleware: [] });
    return this;
  }

  /** GET route */
  get(path: string, handler: Handler): this {
    return this.on('GET', path, handler);
  }

  /** POST route */
  post(path: string, handler: Handler): this {
    return this.on('POST', path, handler);
  }

  /** PUT route */
  put(path: string, handler: Handler): this {
    return this.on('PUT', path, handler);
  }

  /** DELETE route */
  delete(path: string, handler: Handler): this {
    return this.on('DELETE', path, handler);
  }

  /** Handle request */
  handle(req: Request): Response | Promise<Response> {
    // Apply global middleware
    for (const fn of this.middleware) {
      const result = fn(req, () => ({ status: 200, body: null, headers: {} }));
      if (result.status !== 200) return result;
    }

    // Find route
    const key = `${req.method}:${req.path}`;
    const route = this.routes.get(key);
    if (!route) {
      return { status: 404, body: { error: 'Not found' }, headers: {} };
    }

    return route.handler(req);
  }
}

// ============================================================================
// SERVER
// ============================================================================

export function createServer(options: ServerOptions = {}) {
  const router = new Router();
  const port = options.port ?? 3456;
  const host = options.host ?? '0.0.0.0';

  return {
    router,
    
    use(fn: Middleware) {
      router.use(fn);
      return this;
    },

    get(path: string, handler: Handler) {
      router.get(path, handler);
      return this;
    },

    post(path: string, handler: Handler) {
      router.post(path, handler);
      return this;
    },

    put(path: string, handler: Handler) {
      router.put(path, handler);
      return this;
    },

    delete(path: string, handler: Handler) {
      router.delete(path, handler);
      return this;
    },

    async listen() {
      // In Node.js, would start http server here
      // For browser, this is a no-op or would use fetch
      console.log(`Server listening on ${host}:${port}`);
      return { host, port };
    },
  };
}

// ============================================================================
// UTILS
// ============================================================================

/** Parse query string */
export function parseQuery(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const qs = url.split('?')[1];
  if (!qs) return params;
  
  for (const pair of qs.split('&')) {
    const [key, value] = pair.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(value ?? '');
  }
  return params;
}

/** Parse path params */
export function parseParams(path: string, pattern: string): Record<string, string> {
  const params: Record<string, string> = {};
  const pathParts = path.split('/');
  const patternParts = pattern.split('/');
  
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i]?.startsWith(':')) {
      const key = patternParts[i].slice(1);
      params[key] = pathParts[i] ?? '';
    }
  }
  return params;
}