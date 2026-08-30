/**
 * Lightweight privacy-first analytics.
 *
 * Events are buffered in localStorage (ring buffer) so recent activity is
 * available for debugging. When a `VITE_ANALYTICS_ENDPOINT` is configured the
 * same events are delivered as JSON beacons to that endpoint (e.g. an Umami /
 * Plausible-compatible collector). No events leave the device otherwise.
 */

import { loadEnv } from '@/lib/env';

const BUFFER_KEY = 'ra-analytics';
const MAX_EVENTS = 200;

export interface AnalyticsEvent {
  name: string;
  props?: Record<string, string | number | boolean | null>;
  at: string;
}

export function readAnalyticsEvents(): AnalyticsEvent[] {
  try {
    const raw = JSON.parse(localStorage.getItem(BUFFER_KEY) || '[]');
    return Array.isArray(raw) ? (raw as AnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

function bufferedEvents(): AnalyticsEvent[] {
  const events = readAnalyticsEvents();
  return events.length > MAX_EVENTS ? events.slice(-MAX_EVENTS) : events;
}

export function track(name: string, props?: AnalyticsEvent['props']): void {
  const event: AnalyticsEvent = { name, props, at: new Date().toISOString() };
  try {
    const events = bufferedEvents();
    events.push(event);
    localStorage.setItem(BUFFER_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch {
    // Storage unavailable (private mode / quota) — never throw for analytics.
  }

  const endpoint = loadEnv().VITE_ANALYTICS_ENDPOINT;
  if (endpoint && typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
    try {
      const blob = new Blob([JSON.stringify(event)], { type: 'application/json' });
      navigator.sendBeacon(endpoint, blob);
    } catch {
      // Best-effort delivery; never block the app.
    }
  }
}

/** Clears the local analytics buffer (used by tests and the "reset data" flow). */
export function clearAnalytics(): void {
  try {
    localStorage.removeItem(BUFFER_KEY);
  } catch {
    // ignore
  }
}
