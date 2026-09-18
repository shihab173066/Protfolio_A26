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
- Admin studio: <http://localhost:5173/#/admin>

## Admin sign-in

There are no credentials in this repository. Set yours once, from the repo root:

```powershell
npm run set-admin-password
```

This writes your login id, a random salt and a PBKDF2-SHA256 hash (310k iterations) into
the gitignored `shihab-portfolio/.env.local`. **The plaintext password is never stored.**
Restart the dev server afterwards.

> **Know what this protects.** The site is static files with no backend, so the login runs
> entirely in the browser and can be bypassed from devtools. What it does guarantee is that
> your password appears nowhere in git or in `dist/` — only a hash does. This is acceptable
> because the admin panel currently writes to `localStorage` only, so bypassing it lets
> someone edit their own copy of the page and nothing more. If you ever enable the Firestore
> sync below, that stops being true and you need real server-side auth (Firebase Auth) —
> see the header comment in `src/composables/useAuth.js`.

## The résumé PDF

Every "Download resume" button builds a 2-page A4 PDF from the live site content when clicked
(`src/utils/resumePdf.js`). There is no PDF file to keep up to date — edit the site, and the
next download reflects it.

It is written as real text, not a screenshot, so applicant tracking systems can parse it. If
content grows past two pages the generator steps through tighter layout presets, trimming the
oldest roles' bullet points first; job titles, employers and dates are never dropped.

Put your photograph in `public/` as `Shihab_picture.jpg` — it is used for both the hero avatar
and the PDF header. To serve a hand-made PDF instead, set **Admin → Profile → Résumé override
URL** to a full `https://` link.

## Connect Firebase (optional)

Content is saved to `localStorage` by default, which means **admin edits are only visible in the
browser that made them**. To publish edits to visitors, enable the (already-written, currently
dormant) Firestore sync:

1. Create a Firebase project → add a **Web app** → copy the config.
2. `copy .env.example .env.local` and fill in the `VITE_FIREBASE_*` values.
3. Create a **Firestore** database.
4. Deploy `../firestore.rules` (public read, admin-only write) and replace the placeholder UID.
5. Switch `useAuth.js` to Firebase Authentication — a client-side hash is not sufficient once
   the data is shared.

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
  Add `VITE_ADMIN_ID`, `VITE_ADMIN_PW_SALT`, `VITE_ADMIN_PW_HASH` and `VITE_ADMIN_PW_ITERATIONS`
  (copy the values from `.env.local`) as repository secrets, or the deployed admin screen will
  have no credentials to check against. Enable Pages → Source: GitHub Actions.
- **Manual** — `npm run deploy` (uses `gh-pages`).

Routing uses hash history (`/#/admin`) so no server rewrites are needed.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run deploy` | Build and push `dist/` to the `gh-pages` branch |
| `npm run set-admin-password` | Write a new admin credential hash into `.env.local` |
