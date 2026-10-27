# Push to Git & deploy on Vercel

Finora is a static Vite app. Vercel builds it with `npm run build` and serves `dist`.
Routing is hash-based (`/#dashboard`, `/#budgets`, …), so no rewrites are required.

Already in this repo:

- `vercel.json` — Vite preset, build command, `dist` output, security headers
- `.nvmrc` — pins Node 20 for Vercel and CI
- `.gitignore` — excludes `node_modules`, `dist`, `.vercel`, env files
- `.github/workflows/ci.yml` — type-checks and builds on every push/PR

---

## 1. Push the project to GitHub

This folder has already been initialised as a git repository with an initial commit.
Create an **empty** repository on GitHub (no README, no `.gitignore`), then run:

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

If you are starting from a fresh copy instead:

```bash
git init -b main
git add .
git commit -m "feat: Finora personal expense and budget tracker"
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Authenticate with a Personal Access Token or the GitHub CLI (`gh auth login`) if
prompted for a password — GitHub no longer accepts account passwords over HTTPS.

## 2. Import into Vercel

1. Go to <https://vercel.com/new> and sign in (GitHub login is easiest).
2. Under **Import Git Repository**, pick the repo you just pushed.
3. Vercel auto-detects **Vite**. Confirm:
   - **Framework preset:** Vite
   - **Root directory:** `./`
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Install command:** `npm install`
   - **Node.js version:** 20.x
4. Leave environment variables empty — none are needed.
5. Click **Deploy**. The first build takes about a minute.
6. You get a URL like `https://finora-<hash>.vercel.app`. Open it.

From now on, every push to `main` triggers a production deployment, and every pull
request gets its own preview URL. No extra CI deploy step is needed — Vercel handles it.

## 3. Optional: deploy from the terminal

```bash
npm i -g vercel
vercel login
vercel          # preview deployment
vercel --prod   # production deployment
```

Or without installing globally:

```bash
npx vercel --prod
```

The CLI writes `.vercel/`, which is already git-ignored.

## 4. Optional: custom domain

Vercel project → **Settings** → **Domains** → **Add**. Point your DNS at Vercel as
instructed, or use a `*.vercel.app` subdomain. HTTPS is provisioned automatically.

## Verify a deployment

```bash
npm run build     # must pass locally first
npx vercel ls     # list deployments
```

Post-deploy checks: the dashboard loads with sample transactions, the theme toggle
works, and `/#budgets` opens directly in a new tab.

## Things to know

- **Data is per-browser.** Finora is local-first; every visitor's ledger is stored in
  their own `localStorage`. Deploying never shares or syncs transactions. Use
  **Settings → JSON backup / restore** to move data between devices.
- **No environment variables or database.** Nothing to configure in Vercel.
- **Clean URLs.** `vercel.json` enables `cleanUrls`; hash routes are unaffected.
- **Node version.** If a build fails, set the Node.js version to 20.x in Vercel →
  Settings → General (`.nvmrc` normally handles this).
