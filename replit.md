# ReactionArena

ReactionArena is a standalone React + TypeScript app that preserves the imported Zite UI and game mechanics. It runs with Vite on port 5000.

## Run locally or on Replit

```bash
npm run dev
```

The configured `Start application` workflow runs `npm run dev -- --port 5000`.

## Supabase multiplayer setup

1. Create a Supabase project.
2. Apply `supabase/migrations/` in the Supabase SQL editor or through the Supabase CLI.
3. Add these environment variables to the Replit project:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Restart the `Start application` workflow.

The browser uses only the Supabase anon/publishable key. Room creation, joining, host authorization, score ranking, and game advancement run through Supabase security-definer RPC functions. Rooms and Players are enabled for Supabase Realtime so lobby and arena state updates do not require polling.

Without the Supabase variables, solo practice remains available and multiplayer actions show a configuration error instead of using a fallback or hard-coded credential.

### Multiplayer security

Apply all migration files in timestamp order. The latest migration adds an
unguessable per-player capability token. The browser stores the token locally,
while Supabase stores only its SHA-256 hash; public player reads never expose it.
Host actions and score submissions require both the player ID and matching
token, and scores are bounded to the maximum supported arena score.

This is anonymous-play authorization rather than account authentication. A
player can still choose to tamper with their own browser, but cannot use a
publicly readable player ID to act as another player or host.