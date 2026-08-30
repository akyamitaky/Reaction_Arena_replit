import { describe, it, expect, vi, afterEach } from 'vitest';
import { clearErrorLog, initErrorTracking, logError, readErrorLog } from '@/lib/errorLog';
import { readAnalyticsEvents } from '@/lib/analytics';

describe('errorLog', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('records errors into the ring buffer', () => {
    logError('boom');
    logError('nope', 'react-boundary');
    const log = readErrorLog();
    expect(log).toHaveLength(2);
    expect(log[0].message).toBe('boom');
    expect(log[1]).toMatchObject({ message: 'nope', source: 'react-boundary' });
  });

  it('also records an analytics event', () => {
    logError('boom');
    const events = readAnalyticsEvents();
    expect(events.some(e => e.name === 'error' && e.props?.message === 'boom')).toBe(true);
  });

  it('caps the buffer at 50 errors', () => {
    for (let i = 0; i < 60; i++) {
      logError(`err ${i}`);
    }
    expect(readErrorLog()).toHaveLength(50);
  });

  it('captures window errors and unhandled rejections after init', () => {
    initErrorTracking();
    window.dispatchEvent(new ErrorEvent('error', { message: 'window broke', filename: '/x.js' }));
    window.dispatchEvent(new Event('unhandledrejection') as unknown as PromiseRejectionEvent);
    const log = readErrorLog();
    expect(log.some(e => e.message.includes('window broke'))).toBe(true);
    expect(log.some(e => e.message.includes('Unhandled rejection'))).toBe(true);
  });

  it('clears the log', () => {
    logError('boom');
    clearErrorLog();
    expect(readErrorLog()).toHaveLength(0);
  });
});
