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
const PORT = process.env.PORT ?? 3000;

// ── Security & parsing ──────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*' }));

// Stripe webhook needs raw body — mount before json parser
app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));
app.use(express.json());

// ── Global rate limiter ─────────────────────────────────────────
app.use(globalRateLimiter);

// ── Health ──────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Authenticated routes ────────────────────────────────────────
const api = express.Router();
api.use(authMiddleware);
api.use(organizationMiddleware);

api.use('/skills',        skillsRouter);
api.use('/bookings',      bookingsRouter);
api.use('/campaigns',     campaignsRouter);
api.use('/workflows',     workflowsRouter);
api.use('/organizations', organizationsRouter);

app.use('/api', api);

// Billing has mixed auth (webhook is unauthenticated)
app.use('/api', billingRouter);

// ── Global error handler ────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => console.log(`marketing-os-core running on :${PORT}`));

export default app;
