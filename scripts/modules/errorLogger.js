// errorLogger.js
// A simple centralized error logging utility that prefixes errors with a timestamp.

export function logError(message, error) {
    console.error(`[${new Date().toISOString()}] ${message}`, error);
  }
  