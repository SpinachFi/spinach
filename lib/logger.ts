/**
 * Secure logging utilities to prevent sensitive data exposure
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogMetadata {
  [key: string]: unknown;
}

/**
 * Sanitizes error objects to prevent sensitive data leakage
 */
export function sanitizeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      // NEVER include:
      // - stack traces (can contain sensitive data)
      // - response data (can contain API secrets)
      // - request data (can contain auth tokens)
    };
  }

  if (typeof error === 'string') {
    return { error };
  }

  return { error: 'Unknown error occurred' };
}

/**
 * Sanitizes metadata object to remove sensitive fields
 */
function sanitizeMetadata(meta?: LogMetadata): LogMetadata {
  if (!meta) return {};

  // Remove sensitive fields
  const {
    privateKey,
    secret,
    password,
    token,
    authorization,
    apiKey,
    ...safe
  } = meta as Record<string, unknown>;

  return safe;
}

/**
 * Redacts Stellar addresses to show only first/last 4 characters
 */
export function redactAddress(address: string): string {
  if (!address || address.length < 8) return '***';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/**
 * Structured logger with automatic sanitization
 */
export const logger = {
  info: (message: string, meta?: LogMetadata) => {
    console.log(
      JSON.stringify({
        level: 'info',
        message,
        timestamp: new Date().toISOString(),
        ...sanitizeMetadata(meta),
      })
    );
  },

  warn: (message: string, meta?: LogMetadata) => {
    console.warn(
      JSON.stringify({
        level: 'warn',
        message,
        timestamp: new Date().toISOString(),
        ...sanitizeMetadata(meta),
      })
    );
  },

  error: (message: string, error?: unknown, meta?: LogMetadata) => {
    console.error(
      JSON.stringify({
        level: 'error',
        message,
        error: sanitizeError(error),
        timestamp: new Date().toISOString(),
        ...sanitizeMetadata(meta),
      })
    );
  },
};

/**
 * Legacy console.log replacement for gradual migration
 * Use this as a drop-in replacement for console.log/error/warn
 */
export const safeConsole = {
  log: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(message, ...args);
    } else {
      logger.info(message, { args: args.map(String) });
    }
  },

  error: (message: string, error?: unknown) => {
    logger.error(message, error);
  },

  warn: (message: string, meta?: LogMetadata) => {
    logger.warn(message, meta);
  },
};
