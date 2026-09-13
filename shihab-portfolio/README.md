# MD Shihab Hossain — Portfolio

One-page portfolio with a built-in content studio. Vue 3 + Vite + Tailwind CSS, content stored in
Firebase Firestore (with an automatic localStorage fallback), deployable to GitHub Pages.

## Run it

```powershell
cd shihab-portfolio
npm install
npm run dev
```

- Public site: <http://localhost:5173/>
- Admin studio: <http://localhost:5173/#/admin> — dev credentials `admin` / `password1234`

## Add your assets

Put these in `public/`:

| File | Used for |
| --- | --- |
| `profile.jpg` | Hero photograph (falls back to an initials avatar) |
| `MD-Shihab-Hossain-Resume.pdf` | Every "Download resume" button |

Both paths are editable from **Admin → Profile → Contact & files**.

## Connect Firebase (optional but recommended)

1. Create a Firebase project → add a **Web app** → copy the config.
2. `copy .env.example .env.local` and fill in the `VITE_FIREBASE_*` values.
3. Create a **Firestore** database.
4. Deploy `../firestore.rules` (public read, admin-only write) and replace the placeholder UID.
5. For real auth: create an admin user in Firebase Authentication and set `VITE_ADMIN_EMAIL`
   in `.env.local`. The login screen then uses Firebase Auth instead of the dev credentials.

Without these vars everything still works — content is saved to the browser's localStorage.

## Content model

One Firestore document, `portfolio/content`:

```
{ version, theme: { accent }, profile: {...}, sections: [ { id, type, title, subtitle, body,
  visible, inNav, items: [ { id, title, subtitle, meta, badge, description, bullets[], tags[],
  links[] } ] } ] }
```

`type` picks the renderer: `about`, `skills`, `timeline`, `cards`, `list`, `text`, `contact`.
Sections can be created, reordered, hidden and deleted entirely from the admin UI.

## Deploy

- **GitHub Pages** — push to `main`; `.github/workflows/deploy.yml` builds and publishes.
  Add the `VITE_FIREBASE_*` values as repository secrets. Enable Pages → Source: GitHub Actions.
- **Manual** — `npm run deploy` (uses `gh-pages`).

Routing uses hash history (`/#/admin`) so no server rewrites are needed.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run deploy` | Build and push `dist/` to the `gh-pages` branch |
