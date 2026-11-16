# Daytona Roleplay | VC Only

Static site (HTML/CSS/JS) backed by Supabase. Pages: Home, Team, Store, Admin (login + edit team members and store products).

## Run
Open `index.html` through any static server (e.g. `npx serve .`) or deploy to GitHub Pages.

## Supabase setup
- Project: "ljake3818-tech's DRP". URL and publishable key are in `app.js` (safe for the browser; RLS protects the data).
- Tables: `profiles`, `team_members`, `store_items`. Public can read the team and active products; only admins can write.
- Admin access: the account with the admin email gets `role = 'admin'` automatically when it is created.
  Create it in Dashboard -> Authentication -> Users -> Add user (auto-confirm), then turn off public sign-ups.
- Never commit passwords or the `service_role` key.
