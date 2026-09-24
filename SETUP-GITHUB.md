## Publish FlexKnit Link to GitHub

### Option A — from your computer (2 minutes)

1. Download **`flexknit-link-repo.zip`** (workspace root) and unzip it.
2. On github.com click **New repository** → name it (e.g. `flexknit-link`) → **Private** → *do not* initialize with README → **Create**.
3. In the unzipped folder, run:

```bash
cd flexknit-link
git remote add origin https://github.com/<YOUR-USERNAME>/flexknit-link.git
git push -u origin main
```

If your folder isn't a git repo anymore (e.g. the zip was extracted without `.git`), re-init first:

```bash
git init -b main
git add .
git commit -m "FlexKnit Link v1 — logistics x merchandising control tower"
git remote add origin https://github.com/<YOUR-USERNAME>/flexknit-link.git
git push -u origin main
```

### Option B — with the GitHub CLI

```bash
cd flexknit-link
gh repo create flexknit-link --private --source=. --push
```

### Free permanent URL via GitHub Pages (no server needed)

The repo ships with `docs/index.html` — the **standalone single-file app**.
After pushing: **Settings → Pages → Source: *Deploy from a branch* → Branch `main`, folder `/docs` → Save.**
Your app goes live at `https://<YOUR-USERNAME>.github.io/flexknit-link/` — a stable, shareable link that runs entirely in the browser (localStorage persistence, demo data regenerates daily).

> Note: Pages hosts the single-file demo. For the full multi-user experience (shared data between logistics & merchandisers), run `node server.js` on any host (Render/Railway/Fly/VPS) — see README.

### Commit author

The initial commit is authored as *FlexKnit Factories <ops@flexknitfactories.mg>*.
To put it under your own identity:

```bash
git config user.name "Your Name"
git config user.email "you@flexknit.mg"
git commit --amend --reset-author --no-edit
```
