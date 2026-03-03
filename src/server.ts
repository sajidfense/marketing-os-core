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
import { globalRateLimiter } from './middleware/rateLimit.middleware';

const app = express();

app.set('trust proxy', 1);
/* ─────────────────────────────────────────────
   PORT CONFIG (Railway Compatible)
───────────────────────────────────────────── */
const PORT = Number(process.env.PORT) || 8080;

/* ─────────────────────────────────────────────
   SECURITY & CORE MIDDLEWARE
───────────────────────────────────────────── */
app.use(helmet());

// For production, lock this down properly
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : '*',
  })
);

// Stripe webhook must be raw BEFORE json parser
app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));

app.use(express.json());

/* ─────────────────────────────────────────────
   GLOBAL RATE LIMITER
───────────────────────────────────────────── */
app.use(globalRateLimiter);

/* ─────────────────────────────────────────────
   BASIC HEALTH & ROOT ROUTES
───────────────────────────────────────────── */

// Railway sometimes checks root
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
   BILLING ROUTES (Webhook unauthenticated)
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
      message: process.env.NODE_ENV === 'production'
        ? 'Something went wrong'
        : err.message,
    });
  }
);

/* ─────────────────────────────────────────────
   START SERVER (CRITICAL FOR RAILWAY)
───────────────────────────────────────────── */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`marketing-os-core running on :${PORT}`);
});

export default app;
