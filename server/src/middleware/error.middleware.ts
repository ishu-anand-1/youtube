import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { PermissionError } from '../modules/roles/permission.service.js';
import { AppError } from '../errors/index.js';
import { logger } from '../config/logger.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    logger.warn({ details: err.flatten().fieldErrors }, 'Validation Error');
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  if (err instanceof PermissionError) {
    logger.warn({ code: err.code, message: err.message }, 'Permission Denied');
    res.status(err.status).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  if (err instanceof AppError) {
    logger.warn({ code: err.code, message: err.message, status: err.statusCode }, 'Application Error');
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  logger.error({ err: err.message, stack: err.stack }, 'Unhandled Server Error');

  const statusCode = (err as any).statusCode || (err as any).status || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      code: (err as any).code || 'INTERNAL_SERVER_ERROR',
      message: statusCode === 500 ? 'An unexpected server error occurred' : err.message,
    },
  });
}
