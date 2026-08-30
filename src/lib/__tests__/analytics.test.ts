import { describe, it, expect, vi, afterEach } from 'vitest';
import { clearAnalytics, readAnalyticsEvents, track } from '@/lib/analytics';

describe('analytics', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('buffers events in localStorage', () => {
    track('page_view', { path: '/daily' });
    track('game_start', { gameId: 'color' });
    const events = readAnalyticsEvents();
    expect(events).toHaveLength(2);
    expect(events[0].name).toBe('page_view');
    expect(events[0].props).toEqual({ path: '/daily' });
    expect(events[1].name).toBe('game_start');
  });

  it('caps the buffer at 200 events', () => {
    for (let i = 0; i < 210; i++) {
      track('tick', { i });
    }
    const events = readAnalyticsEvents();
    expect(events).toHaveLength(200);
    expect(events[0].props).toEqual({ i: 10 });
  });

  it('does not throw when localStorage is unavailable', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => track('page_view')).not.toThrow();
    spy.mockRestore();
  });

  it('sends a beacon when an analytics endpoint is configured', async () => {
    const sendBeacon = vi.fn<(url: string | URL, data?: BodyInit) => boolean>(() => true);
    Object.defineProperty(navigator, 'sendBeacon', { value: sendBeacon, configurable: true });
    vi.stubEnv('VITE_ANALYTICS_ENDPOINT', 'https://collect.example.com');

    track('page_view', { path: '/' });
    expect(sendBeacon).toHaveBeenCalledTimes(1);
    const [url, data] = sendBeacon.mock.calls[0];
    expect(url).toBe('https://collect.example.com');
    const body = JSON.parse(await (data as Blob).text());
    expect(body).toMatchObject({ name: 'page_view' });
  });

  it('clears the buffer', () => {
    track('page_view');
    clearAnalytics();
    expect(readAnalyticsEvents()).toHaveLength(0);
  });
});
