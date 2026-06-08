# PostKeeper Library Dashboard

React + Vite dashboard for your PostKeeper Supabase library.

## Local setup

1. Copy `.env.example` to `.env`
2. Put your values:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Run:
   ```bash
   npm install
   npm run dev
   ```

## Important
Do NOT use `SUPABASE_SERVICE_ROLE_KEY` in the frontend.
