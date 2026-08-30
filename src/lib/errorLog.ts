/**
 * Client-side error log. Runtime errors are captured into a small ring buffer
 * so the most recent failures can be inspected (and optionally reported via
 * the analytics beacon). The buffer never leaves the device unless an
 * analytics endpoint is configured.
 */

import { track } from '@/lib/analytics';

const BUFFER_KEY = 'ra-error-log';
const MAX_ERRORS = 50;

export interface LoggedError {
  message: string;
  source?: string;
  at: string;
}

export function readErrorLog(): LoggedError[] {
  try {
    const raw = JSON.parse(localStorage.getItem(BUFFER_KEY) || '[]');
    return Array.isArray(raw) ? (raw as LoggedError[]) : [];
  } catch {
    return [];
  }
}

export function logError(message: string, source?: string): void {
  const entry: LoggedError = { message, source, at: new Date().toISOString() };
  try {
    const log = readErrorLog();
    log.push(entry);
    localStorage.setItem(BUFFER_KEY, JSON.stringify(log.slice(-MAX_ERRORS)));
  } catch {
    // ignore storage failures
  }
  track('error', { message, source: source ?? null });
}

export function clearErrorLog(): void {
  try {
    localStorage.removeItem(BUFFER_KEY);
  } catch {
    // ignore
  }
}

/** Global handlers for uncaught errors and unhandled promise rejections. */
export function initErrorTracking(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('error', event => {
    logError(event.message || 'Unknown error', `window:${event.filename || 'unknown'}`);
  });
  window.addEventListener('unhandledrejection', event => {
    const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
    logError(`Unhandled rejection: ${reason}`, 'promise');
  });
}
