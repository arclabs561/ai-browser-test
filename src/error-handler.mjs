/**
 * Global Error Handler
 * 
 * Handles unhandled promise rejections and uncaught exceptions.
 * Prevents silent failures and improves debugging.
 */

import { error } from './logger.mjs';

/**
 * Initialize global error handlers
 * 
 * Should be called early in application startup.
 * Only call once per process.
 */
export function initErrorHandlers() {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    error('[Unhandled Rejection]', {
      reason: reason instanceof Error ? {
        message: reason.message,
        stack: reason.stack,
        name: reason.name
      } : reason,
      promise: promise?.toString?.() || 'Unknown promise'
    });
    
    // In production, you might want to:
    // - Log to monitoring service (Sentry, DataDog, etc.)
    // - Send alerts
    // - Gracefully shutdown
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    error('[Uncaught Exception]', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    
    // Uncaught exceptions are usually fatal
    // Exit process after logging (let process manager restart)
    process.exit(1);
  });
  
  // Handle warnings
  process.on('warning', (warning) => {
    error('[Process Warning]', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack
    });
  });
}

