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

There are no credentials in this repository. Sign-in picks one of two modes automatically,
depending on whether `VITE_FIREBASE_*` reached the build.

**Firebase mode** (configured) — email/password through Firebase Authentication. The admin
account lives in the Firebase console, and Firestore rules verify the resulting token on
Google's servers, so the gate genuinely holds. Set it up once with
[`../FIREBASE_SETUP.md`](../FIREBASE_SETUP.md).

**Local mode** (no Firebase config) — a PBKDF2-SHA256 hash (310k iterations) written into the
gitignored `shihab-portfolio/.env.local` by running this from the repo root:

```powershell
npm run set-admin-password
```

**The plaintext password is never stored.** Restart the dev server afterwards.

> **Know what local mode protects.** With no backend, that login runs entirely in the browser
> and can be bypassed from devtools. What it does guarantee is that your password appears
> nowhere in git or in `dist/` — only a hash does. It is acceptable only because in this mode
> the admin panel writes to `localStorage` and nothing else, so bypassing it lets someone edit
> their own copy of the page and nothing more. Once content is shared through Firestore that
> stops being true — which is why configuring Firebase switches the login to Firebase Auth
> rather than layering it on top. See the header comment in `src/composables/useAuth.js`.

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

## Connect Firebase

Without `VITE_FIREBASE_*`, content is saved to `localStorage`, which means **admin edits are only
visible in the browser that made them** — visitors keep seeing the defaults. Configuring Firebase
switches both the content store (Firestore) and the login (Firebase Auth) over in one step.

Full walkthrough: **[`../FIREBASE_SETUP.md`](../FIREBASE_SETUP.md)**. In short:

1. Create a Firebase project → add a **Web app** → copy the config.
2. **Authentication** → enable Email/Password, create the admin user, and add your GitHub Pages
   domain under Authorized domains.
3. Create a **Firestore** database.
4. Publish `../firestore.rules` (public read, admin-only write) and set the admin address in it.
5. `copy .env.example .env.local`, fill in the `VITE_FIREBASE_*` values, restart the dev server.
6. Add the same six values as GitHub repository secrets so the deployed build gets them too.

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
  Set Pages → Source to **GitHub Actions**.

  Env files are gitignored, so the CI build only sees what you add under Settings → Secrets and
  variables → Actions. Add the six `VITE_FIREBASE_*` values there, or the deployed admin screen
  has nothing to authenticate against and reports *no sign-in configured*.
- **Manual** — `npm run deploy` (uses `gh-pages`). This pushes your local `dist/`, which means it
  can quietly overwrite the CI build with a stale one. Pick one deploy route and stick to it.

Content edits made in the admin studio publish through Firestore and need no rebuild. Only code
and files in `public/` require a push.

Routing uses hash history (`/#/admin`) so no server rewrites are needed.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run deploy` | Build and push `dist/` to the `gh-pages` branch |
| `npm run set-admin-password` | Write a new admin credential hash into `.env.local` |
