import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import Stripe from 'stripe';
import { env } from '../config/env';

/**
 * Structured error shape returned by the API.
 */
interface ErrorResponse {
  error: string;
  details?: unknown;
  statusCode: number;
}

/**
 * Application-level error that carries an HTTP status code.
 * Throw this from controllers / services for predictable error responses.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Centralized Express error handler.
 *
 * Must be registered AFTER all routes.
 * The unused `_next` parameter is required by Express to recognise this as an
 * error-handling middleware (4-arg signature).
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // ── Known application error ───────────────────────────────────
  if (err instanceof AppError) {
    const body: ErrorResponse = {
      error: err.message,
      statusCode: err.statusCode,
    };
    // Only include details in non-production (may contain internal info)
    if (err.details && env.NODE_ENV !== 'production') {
      body.details = err.details;
    }
    res.status(err.statusCode).json(body);
    return;
  }

  // ── Zod validation error ──────────────────────────────────────
  if (err instanceof ZodError) {
    const flat = err.flatten();
    res.status(422).json({
      error: 'Validation failed',
      statusCode: 422,
      details: {
        fieldErrors: flat.fieldErrors,
        formErrors: flat.formErrors,
      },
    } satisfies ErrorResponse);
    return;
  }

  // ── Stripe error ──────────────────────────────────────────────
  if (err instanceof Stripe.errors.StripeError) {
    const status =
      err.type === 'StripeCardError'
        ? 402
        : err.type === 'StripeInvalidRequestError'
          ? 400
          : err.type === 'StripeAuthenticationError'
            ? 401
            : err.type === 'StripeRateLimitError'
              ? 429
              : 500;

    res.status(status).json({
      error: err.message,
      statusCode: status,
      details:
        env.NODE_ENV === 'production'
          ? undefined
          : { type: err.type, code: err.code },
    } satisfies ErrorResponse);
    return;
  }

  // ── SyntaxError from body-parser (malformed JSON) ─────────────
  if (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as SyntaxError & { status: number }).status === 400
  ) {
    res.status(400).json({
      error: 'Malformed JSON in request body',
      statusCode: 400,
    } satisfies ErrorResponse);
    return;
  }

  // ── Unexpected / unknown error ────────────────────────────────
  console.error('[error-handler] Unhandled error:', err);

  const message =
    env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error
        ? err.message
        : String(err);

  const body: ErrorResponse = {
    error: message,
    statusCode: 500,
  };

  if (env.NODE_ENV !== 'production' && err instanceof Error) {
    body.details = { stack: err.stack };
  }

  res.status(500).json(body);
}
