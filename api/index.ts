// Vercel Serverless Function — wraps the Express app as a handler.
// Env vars are set in the Vercel dashboard; no dotenv needed at runtime.
//
// Root package.json has "type": "module" (for Vite), but the server
// is built as CommonJS into server/dist/. Use createRequire to bridge.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const app = require('../server/dist/app').default;
export default app;
