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

### ⚠️ Security note before applying the migration

The current migration's RPCs identify players via a caller-supplied `p_player_id` rather than a Supabase-authenticated identity (`auth.uid()`). Because the RLS policies expose all player records publicly, any client can look up a room's host ID and call `start_arena` or `advance_game` as that host, or submit arbitrary scores for any player.

**Do not apply the migration to a public Supabase project without first reworking authorization to use Supabase Auth (`auth.uid()`) or an unguessable per-player capability token that is never exposed in a public read policy.**