import { Router, Request, Response } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { stripe } from '../lib/stripe';
import { supabase } from '../lib/supabase';
import { env } from '../config/env';
import { authMiddleware } from '../middleware/auth.middleware';
import { organizationMiddleware } from '../middleware/organization.middleware';
import { getOrCreateUsage, addPurchasedCredits } from '../services/credits.service';
import { CREDIT_PACKS, CREDIT_COSTS } from '../config/credits';

const checkoutSchema = z.object({
  priceId: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

const buyCreditsSchema = z.object({
  packId: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export const billingRouter = Router();

// ── Create checkout session (authenticated) ─────────────────────
billingRouter.post(
  '/create-checkout-session',
  authMiddleware,
  organizationMiddleware,
  async (req: Request, res: Response) => {
    const { organizationId, userId } = req;
    const body = checkoutSchema.parse(req.body);
    const { priceId, successUrl, cancelUrl } = body;

    // Get or create Stripe customer
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('organization_id', organizationId)
      .single();

    let customerId = sub?.stripe_customer_id;

    if (!customerId) {
      const { data: user } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', userId)
        .single();

      const customer = await stripe.customers.create({
        email: user?.email,
        name: user?.full_name ?? undefined,
        metadata: { organization_id: organizationId },
      });

      customerId = customer.id;

      await supabase.from('subscriptions').upsert(
        { organization_id: organizationId, stripe_customer_id: customerId, plan: 'free' },
        { onConflict: 'organization_id' },
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { organization_id: organizationId },
    });

    res.json({ success: true, data: { url: session.url } });
  },
);

// ── Get credit usage (authenticated) ────────────────────────────
billingRouter.get(
  '/credits',
  authMiddleware,
  organizationMiddleware,
  async (req: Request, res: Response) => {
    try {
      const usage = await getOrCreateUsage(req.organizationId);
      const resetDate = new Date(usage.reset_date);
      const now = new Date();
      const daysUntilReset = Math.max(0, Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const percent = usage.credits_limit > 0
        ? Math.min(100, Math.round((usage.credits_used / usage.credits_limit) * 100))
        : 0;

      res.json({
        success: true,
        data: {
          credits_used: usage.credits_used,
          credits_limit: usage.credits_limit,
          reset_date: usage.reset_date,
          days_until_reset: daysUntilReset,
          percent,
          costs: CREDIT_COSTS,
          packs: CREDIT_PACKS,
        },
      });
    } catch (err) {
      console.error('[billing] Credits fetch error:', err);
      res.status(500).json({ error: 'Failed to fetch credit usage' });
    }
  },
);

// ── Buy credits (Stripe one-time checkout) ──────────────────────
billingRouter.post(
  '/buy-credits',
  authMiddleware,
  organizationMiddleware,
  async (req: Request, res: Response) => {
    const { organizationId, userId } = req;
    const body = buyCreditsSchema.parse(req.body);
    const { packId, successUrl, cancelUrl } = body;

    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) {
      res.status(400).json({ error: 'Invalid credit pack' });
      return;
    }

    // Get or create Stripe customer
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('organization_id', organizationId)
      .single();

    let customerId = sub?.stripe_customer_id;

    if (!customerId) {
      const { data: user } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', userId)
        .single();

      const customer = await stripe.customers.create({
        email: user?.email,
        name: user?.full_name ?? undefined,
        metadata: { organization_id: organizationId },
      });

      customerId = customer.id;

      await supabase.from('subscriptions').upsert(
        { organization_id: organizationId, stripe_customer_id: customerId, plan: 'free' },
        { onConflict: 'organization_id' },
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: pack.priceUsd,
            product_data: {
              name: `${pack.credits} AI Credits`,
              description: `One-time purchase of ${pack.credits} AI credits for Syntra OS`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        organization_id: organizationId,
        credit_pack_id: pack.id,
        credits: String(pack.credits),
        type: 'credit_purchase',
      },
    });

    res.json({ success: true, data: { url: session.url } });
  },
);

// ── Stripe webhook (unauthenticated, raw body) ─────────────────
billingRouter.post('/webhook/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: `Webhook signature failed: ${message}` });
    return;
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.organization_id;

      // ── Credit purchase (one-time payment) ──────────────
      if (session.metadata?.type === 'credit_purchase' && orgId) {
        const credits = parseInt(session.metadata.credits ?? '0', 10);
        if (credits > 0) {
          await addPurchasedCredits(orgId, credits, session.id);
          console.log(`[billing] Added ${credits} credits to org ${orgId}`);
        }
        break;
      }

      // ── Subscription checkout ───────────────────────────
      if (orgId && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        await supabase.from('subscriptions').upsert(
          {
            organization_id: orgId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: sub.id,
            status: sub.status,
            plan: 'starter', // Update based on price lookup
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          },
          { onConflict: 'organization_id' },
        );

        // Sync subscription_status on the organization
        if (sub.status === 'active' || sub.status === 'trialing') {
          await supabase
            .from('organizations')
            .update({ subscription_status: 'active' })
            .eq('id', orgId);
        }
      }
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from('subscriptions')
        .update({
          status: sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
        })
        .eq('stripe_subscription_id', sub.id);

      // Sync subscription_status on the organization (skip comped orgs)
      const { data: subRecord } = await supabase
        .from('subscriptions')
        .select('organization_id')
        .eq('stripe_subscription_id', sub.id)
        .single();

      if (subRecord) {
        const orgStatus = (sub.status === 'active' || sub.status === 'trialing')
          ? 'active'
          : 'inactive';
        await supabase
          .from('organizations')
          .update({ subscription_status: orgStatus })
          .eq('id', subRecord.organization_id)
          .eq('comped', false); // Don't override comped orgs
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoice.subscription as string | null;
      if (subId) {
        // Mark subscription as past_due
        const { data: subRecord } = await supabase
          .from('subscriptions')
          .select('organization_id')
          .eq('stripe_subscription_id', subId)
          .single();

        if (subRecord) {
          await supabase
            .from('organizations')
            .update({ subscription_status: 'inactive' })
            .eq('id', subRecord.organization_id)
            .eq('comped', false);
          console.log(`[billing] Payment failed for org ${subRecord.organization_id}, set inactive`);
        }
      }
      break;
    }

    default:
      console.log(`[billing] Unhandled event: ${event.type}`);
  }

  res.json({ received: true });
});
