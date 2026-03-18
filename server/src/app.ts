import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';

// Import routers
import { skillsRouter } from './routes/skills.routes';
import { bookingsRouter } from './routes/bookings.routes';
import { campaignsRouter } from './routes/campaigns.routes';
import { workflowsRouter } from './routes/workflows.routes';
import { billingRouter } from './routes/billing.routes';
import { organizationsRouter } from './routes/organizations.routes';
import { brandingRouter } from './routes/branding.routes';
import { metaRouter } from './routes/meta.routes';
import { reportsRouter } from './routes/reports.routes';
import { onboardingRouter } from './routes/onboarding.routes';
import { adminRouter } from './routes/admin.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { seoRouter } from './routes/seo.routes';
import { integrationsRouter } from './routes/integrations.routes';

// Import middleware
import { authMiddleware } from './middleware/auth.middleware';
import { organizationMiddleware } from './middleware/organization.middleware';
import { globalRateLimiter } from './middleware/rateLimit.middleware';
import { errorHandler } from './middleware/error.middleware';

const app = express();

// Trust proxy for Railway/Render/cloud
app.set('trust proxy', 1);

// Root route (health check for Railway)
app.get('/', (_req, res) => {
  res.json({ service: 'marketing-os-core', status: 'running' });
});

// Health endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Security middleware
app.use(helmet());

const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (server-to-server, curl, mobile)
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
}));

// Stripe webhook must be before JSON parser
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

// JSON parser
app.use(express.json({ limit: '10mb' }));

// Rate limiter
app.use(globalRateLimiter);

// API health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', environment: env.NODE_ENV, timestamp: new Date().toISOString() });
});

// Admin bypass (secret-gated, no auth or org required) — must be before authenticated API router
app.use('/api/admin', adminRouter);

// Authenticated API routes
const api = express.Router();
api.use(authMiddleware);
api.use(organizationMiddleware);

api.use('/dashboard', dashboardRouter);
api.use('/skills', skillsRouter);
api.use('/bookings', bookingsRouter);
api.use('/campaigns', campaignsRouter);
api.use('/workflows', workflowsRouter);
api.use('/organizations', organizationsRouter);
api.use('/branding', brandingRouter);
api.use('/meta', metaRouter);
api.use('/reports', reportsRouter);
api.use('/seo', seoRouter);
api.use('/integrations', integrationsRouter);

app.use('/api', api);

// Onboarding routes (auth only, no org required)
app.use('/api/onboarding', authMiddleware, onboardingRouter);

// Billing routes (webhook is unauthenticated, checkout needs auth)
app.use('/api/billing', billingRouter);

// Error handler (must be last)
app.use(errorHandler);

export default app;
