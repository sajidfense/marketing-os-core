import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { skillsRouter } from './routes/skills.routes';
import { bookingsRouter } from './routes/bookings.routes';
import { campaignsRouter } from './routes/campaigns.routes';
import { workflowsRouter } from './routes/workflows.routes';
import { billingRouter } from './routes/billing.routes';
import { organizationsRouter } from './routes/organizations.routes';
import { authMiddleware } from './middleware/auth.middleware';
import { organizationMiddleware } from './middleware/organization.middleware';
// Temporarily disable rate limiter until stable
// import { globalRateLimiter } from './middleware/rateLimit.middleware';

const app = express();

/* ─────────────────────────────────────────────
   TRUST PROXY (REQUIRED FOR RAILWAY)
───────────────────────────────────────────── */
app.set('trust proxy', 1);

/* ─────────────────────────────────────────────
   PORT (MUST USE RAILWAY PROVIDED PORT)
───────────────────────────────────────────── */
const PORT = Number(process.env.PORT);

if (!PORT) {
  throw new Error('PORT environment variable not set');
}

/* ─────────────────────────────────────────────
   BASIC ROOT ROUTE (FOR RAILWAY HEALTH)
───────────────────────────────────────────── */
app.get('/', (_req, res) => {
  res.send('Marketing OS Backend Running');
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

/* ─────────────────────────────────────────────
   SECURITY & CORE MIDDLEWARE
───────────────────────────────────────────── */
app.use(helmet());

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : '*',
  })
);

// Stripe webhook must be mounted BEFORE express.json
app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));

app.use(express.json());

/* ─────────────────────────────────────────────
   RATE LIMITER (ENABLE LATER WHEN STABLE)
───────────────────────────────────────────── */
// app.use(globalRateLimiter);

/* ─────────────────────────────────────────────
   AUTHENTICATED API ROUTES
───────────────────────────────────────────── */
const api = express.Router();

api.use(authMiddleware);
api.use(organizationMiddleware);

api.use('/skills', skillsRouter);
api.use('/bookings', bookingsRouter);
api.use('/campaigns', campaignsRouter);
api.use('/workflows', workflowsRouter);
api.use('/organizations', organizationsRouter);

app.use('/api', api);

/* ─────────────────────────────────────────────
   BILLING ROUTES (WEBHOOK UNAUTHENTICATED)
───────────────────────────────────────────── */
app.use('/api', billingRouter);

/* ─────────────────────────────────────────────
   GLOBAL ERROR HANDLER
───────────────────────────────────────────── */
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('[ERROR]', err);
    res.status(500).json({
      error: 'Internal server error',
      message:
        process.env.NODE_ENV === 'production'
          ? 'Something went wrong'
          : err.message,
    });
  }
);

/* ─────────────────────────────────────────────
   PREVENT SILENT CRASHES
───────────────────────────────────────────── */
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

/* ─────────────────────────────────────────────
   START SERVER
───────────────────────────────────────────── */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`marketing-os-core running on :${PORT}`);
});

export default app;
