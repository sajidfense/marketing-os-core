import dotenv from 'dotenv';
import path from 'path';

// Support DOTENV_CONFIG_PATH for monorepo setups (root .env shared with server)
const envPath = process.env.DOTENV_CONFIG_PATH
  ? path.resolve(process.env.DOTENV_CONFIG_PATH)
  : path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });
import { env } from './config/env';
import app from './app';

// Prevent silent crashes
process.on('unhandledRejection', (err) => {
  console.error('[FATAL] Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`[marketing-os-core] Server running on :${env.PORT} (${env.NODE_ENV})`);
});
