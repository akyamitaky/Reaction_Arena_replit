import { describe, it, expect } from 'vitest';
import { asError } from '@/lib/arenaApi';

describe('asError', () => {
  it('returns the server message verbatim for user-friendly errors', () => {
    const err = asError({ code: 'A0012', message: 'Room not found. Check the code and try again.' });
    expect(err.message).toContain('Room not found');
  });

  it('maps missing-migration codes to the actionable setup message', () => {
    for (const code of ['P0001', '42883', '42704']) {
      expect(asError({ code, message: 'boom' }).message).toContain('Run all SQL files in supabase/migrations/');
    }
  });

  it('detects missing migrations by legacy message text too', () => {
    const err = asError({ code: '', message: 'Could not find the function public.create_room' });
    expect(err.message).toContain('supabase/migrations/');
  });

  it('maps authorization failures to the token-session message', () => {
    const err = asError({ code: 'A0041', message: 'Player authorization failed.' });
    expect(err.message).toContain('valid player token');
  });

  it('detects authorization failures by legacy message text', () => {
    const err = asError({ code: '', message: 'Only the host can start.' });
    expect(err.message).toContain('valid player token');
  });

  it('falls back to a generic message', () => {
    const err = asError(null);
    expect(err.message).toBe('Something went wrong. Please try again.');
  });
});
