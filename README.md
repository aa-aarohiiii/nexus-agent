# NEXUS — deploy to Vercel

## What's in here
- `src/App.jsx` — the whole app (same code as the Claude artifact)
- `api/plan.js` — a Vercel serverless function that holds your real Anthropic
  API key on the server and proxies planning requests to it. The browser
  never sees the key; it only ever calls `/api/plan`.

## 1. Get an Anthropic API key
Go to https://console.anthropic.com → API Keys → Create Key. This is a
separate thing from your claude.ai login — it's billed per API call.

## 2. Push this folder to GitHub
```bash
cd nexus-agent
git init
git add .
git commit -m "NEXUS agent"
gh repo create nexus-agent --public --source=. --push
# (or create a repo on github.com and `git remote add origin ...` + push manually)
```

## 3. Import into Vercel
- Go to https://vercel.com/new
- Import the GitHub repo you just pushed
- Framework preset: Vite (should auto-detect)
- Before clicking Deploy, open **Environment Variables** and add:
  - `ANTHROPIC_API_KEY` = your key from step 1
- Click **Deploy**

## 4. Open it
Vercel gives you a URL like `nexus-agent.vercel.app`. Open it in Chrome on
your laptop or phone — same link works on both, no login needed.

## Local development (optional)
```bash
npm install
cp .env.example .env   # then paste your real key into .env
npm i -g vercel
vercel dev              # runs both the frontend and /api/plan locally
```
(Plain `npm run dev` will run the frontend fine, but `/api/plan` calls will
404 because that route only runs under Vercel's dev server or in production.)

## If planning fails
The app has an offline fallback planner built in — if `/api/plan` ever
errors (missing key, rate limit, etc.), it silently falls back to a local
rule-based planner so the UI never breaks, it just won't be Claude-generated
for that request.
