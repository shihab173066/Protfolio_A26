# Firebase setup

One-time setup so the admin studio publishes to visitors instead of only to your own browser.

Everything in the app is already written for this. What's left is creating the Firebase project
(which needs your Google login, so it has to be you) and pasting six values into two places.

Sign in to <https://console.firebase.google.com> as **shihabprotfolio@gmail.com** before you start.

---

## 1. Create the project

1. **Add project** → name it anything (`shihab-portfolio` is fine).
2. Google Analytics — **disable it**. Nothing here uses it.
3. Wait for provisioning, then **Continue**.

## 2. Register a web app and copy the config

1. On the project overview, click the **`</>`** (Web) icon.
2. App nickname: `portfolio`. Do **not** tick "Also set up Firebase Hosting".
3. **Register app**. You now get a `firebaseConfig` block:

   ```js
   const firebaseConfig = {
     apiKey: "AIza…",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.firebasestorage.app",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abc123",
   }
   ```

**Leave this tab open** — you need these six values twice, in steps 6 and 7.

> These are not secrets. Firebase web config is public by design and ships inside every
> Firebase site's JavaScript. What protects your data is the rules file in step 5.

## 3. Turn on email/password sign-in

1. **Build → Authentication → Get started**.
2. **Sign-in method** tab → **Email/Password** → enable the first toggle (leave passwordless off) →
   **Save**.
3. **Users** tab → **Add user**:
   - Email: `shihabprotfolio@gmail.com`
   - Password: pick a strong one — **this becomes your new admin password.**

   Your old `sh#@@$%12T0TS` password stops applying here. It belonged to the browser-only hash
   login, which Firebase Auth now replaces. Set whatever you like; nothing in this repo needs to
   know it.

4. **Settings** tab → **Authorized domains** → **Add domain** → `shihab173066.github.io`

   Skip this and sign-in on the live site fails with `auth/unauthorized-domain`. `localhost` is
   already on the list, which is why dev will work regardless.

## 4. Create the Firestore database

1. **Build → Firestore Database → Create database**.
2. Edition: **Standard**. Both editions have a daily free tier, so cost is not the deciding
   factor — Standard is simply the right shape for this app. It indexes single fields
   automatically and bills per document, so one "Save & publish" is one write. Enterprise
   expects you to manage indexes by hand, bills in 1 KiB write units with index writes counted
   on top, and exists for MongoDB migrations and high-throughput workloads. This site reads one
   small document on page load.
3. Database ID: leave it as **`(default)`**. The free tier applies to one database per project —
   the first one created gets it.
4. Mode: **Native mode**, not Datastore mode. The Firebase console does this by default, and
   unlike the edition it genuinely **cannot be changed afterwards**. The Firebase web SDK this
   app uses only speaks Native mode.
5. Location: **`asia-south1` (Mumbai)** — the nearest region to Dhaka with mature peering.
   `asia-southeast1` (Singapore) is an equally good alternative. Choose a *regional* location,
   not a multi-region one like `nam5` or `eur3`: multi-region buys a 99.999% availability SLA
   this site does not need, and costs more per operation past the free tier. **This cannot be
   changed later either** — moving means creating a new database.
6. Start in **production mode**. The next step replaces the rules anyway.

## 5. Publish the security rules

1. Firestore Database → **Rules** tab.
2. Delete what's there and paste the entire contents of [`firestore.rules`](firestore.rules).
3. **Publish**.

That file allows the whole world to read `portfolio/content` (visitors must, to see your site) and
allows writes only from `shihabprotfolio@gmail.com`. That check runs on Google's servers, which is
what makes this real security rather than a hidden button.

## 6. Wire up your local machine

Open `shihab-portfolio/.env.local` and add the six values from step 2 above the existing
`VITE_ADMIN_*` lines.

**Paste your own values.** The right-hand sides below are placeholders describing what goes
there — copying this block as-is produces `auth/api-key-not-valid`:

```dotenv
VITE_FIREBASE_API_KEY=<apiKey from step 2, starts with AIzaSy, about 39 characters>
VITE_FIREBASE_AUTH_DOMAIN=<authDomain, ends in .firebaseapp.com>
VITE_FIREBASE_PROJECT_ID=<projectId>
VITE_FIREBASE_STORAGE_BUCKET=<storageBucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<messagingSenderId, a 12-digit number>
VITE_FIREBASE_APP_ID=<appId, looks like 1:123...:web:abc...>
```

No quotes, no spaces around the `=`, and nothing after the value on the same line.

Get them from **Project settings** (gear icon, top left) **→ General →** scroll to **Your apps →**
your web app **→ SDK setup and configuration → Config**. They're the same values step 2 showed
you when you registered the app.

Then restart the dev server — **Vite reads env files only at startup**, so a running server will
keep reporting no Firebase until you stop and restart it:

```powershell
npm run dev
```

Go to <http://localhost:5173/#/admin>. The field should now read **Admin email**, and the header
after sign-in should say **Firebase Firestore · live**. If it still says *Local browser storage*,
the env file was not picked up — check for typos in the variable names.

Sign in, make a small edit, click **Save & publish**. The toast should read *Published to Firebase*,
and the document should appear in Firestore Database → Data under `portfolio/content`.

## 7. Wire up GitHub Pages

Go to **<https://github.com/shihab173066/Protfolio_A26/settings/secrets/actions>** and add the same
six values as repository secrets (**New repository secret**, one per value — names must match
exactly):

| Secret name | Value |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

Then confirm **Settings → Pages → Source** is set to **GitHub Actions** (not "Deploy from a
branch"). The workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) injects
these secrets into the build; a branch-based deploy would serve a stale `dist/` and ignore them
entirely.

Push to `main` — or run the workflow manually from the **Actions** tab — and wait for it to go
green.

## 8. Verify the live site

1. Open `https://shihab173066.github.io/Protfolio_A26/#/admin`.
2. The amber "no sign-in configured" warning should be gone.
3. Sign in with `shihabprotfolio@gmail.com` and the password from step 3.
4. Edit something, **Save & publish**.
5. Open the site in a private window, or on your phone. **The edit should be there.** That is the
   thing that did not work before.

---

## After this

- **Content edits** — admin studio → Save & publish. Live immediately, no git, no rebuild.
- **Code and images** — still a git push. Photos go in `shihab-portfolio/public/`, referenced as
  `./filename.jpg`. The admin upload button only writes files while the dev server is running;
  on the live site it embeds images under 150 KB into the content document and tells you to use
  `public/` for anything larger.

## Cost

The free Spark plan covers this comfortably — a personal portfolio is a single small document read
on page load. Firestore's free tier allows 50,000 document reads per day. You do not need to add a
payment method.

## If something breaks

| What you see | Cause |
| --- | --- |
| *This build has no sign-in configured* | `VITE_FIREBASE_*` missing. Locally: `.env.local` + restart. Live: repository secrets + re-run the workflow. |
| `auth/api-key-not-valid` | The config values are placeholders or mistyped. Re-copy all six from Project settings → Your apps → Config, then restart the dev server. Nothing to do with your email or password. |
| *Email/password sign-in is switched off* | Step 3.2 not done. |
| *This domain is not authorised* | Step 3.4 — add `shihab173066.github.io`. |
| *Firestore rejected the write* | Step 5 not published, or the account's email doesn't match the address in `firestore.rules`. |
| *The Firestore database does not exist yet* | Step 4 not done. |
| Header still says *Local browser storage* | The build had no Firebase config — restart the dev server, or check the secret names. |
| Edits vanish on reload | Still in localStorage mode. Same cause as above. |

## Rolling back

Clearing the `VITE_FIREBASE_*` values returns the app to browser-only localStorage mode, and the
old hash login (`npm run set-admin-password`) takes over again. Nothing is deleted; the Firestore
document just stops being read.
