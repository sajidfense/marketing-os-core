// Vercel Serverless Function — wraps the Express app as a handler.
// Env vars are set in the Vercel dashboard; no dotenv needed at runtime.
//
// Root package.json has "type": "module" (for Vite), but the server
// is built as CommonJS into server/dist/. Use createRequire to bridge.
import { createRequire } from 'node:module';
import type { IncomingMessage, ServerResponse } from 'node:http';

let app: ((req: IncomingMessage, res: ServerResponse) => void) | null = null;
let loadError: string | null = null;

try {
  const require = createRequire(import.meta.url);
  app = require('../server/dist/app').default;
} catch (err: unknown) {
  loadError = err instanceof Error ? err.message : String(err);
  console.error('[api/index] Failed to load Express app:', loadError);
}

export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (!app) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Server configuration error',
      detail: loadError,
    }));
    return;
  }
  return app(req, res);
}
