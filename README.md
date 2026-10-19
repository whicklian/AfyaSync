# AfyaSync

AfyaSync is an offline-first community health visit app. Sign in to record visits,
keep them on this device, and sync them to Supabase when online. The visit history
remains available on the device after sync.

## Run locally

Install dependencies and start the Vite development server:

```sh
npm install
npm run dev
```

## Supabase setup

Create a Supabase project, enable email/password authentication, and configure
the project's site URL and allowed redirect URLs for the local and deployed
application origins. Email confirmation and password reset delivery must also
be configured in the Supabase Auth settings.

Set the Supabase project URL and its publishable/anon key in a root `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

The app also accepts `NEXT_PUBLIC_SUPABASE_URL` with
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
Only use a publishable/anon key in this browser app; never expose a
service-role key through a client-side environment variable. Restart the Vite
server after changing `.env`.

### Health visit table

The `health_visits` table must include a nullable text column named `visit_bp`.
The current Supabase error indicates that this column is missing. Run this in
the Supabase SQL Editor to add it without changing existing visit data:

```sql
alter table public.health_visits
add column if not exists visit_bp text;

notify pgrst, 'reload schema';
```

Pending visits remain stored locally and automatic sync will retry when the
table schema is corrected.

The app provides email/password sign-in, account creation, and password-reset
email flows. Users need a Supabase account to access the visit workspace.

## Checks

```sh
npm run lint
npm run build
```
