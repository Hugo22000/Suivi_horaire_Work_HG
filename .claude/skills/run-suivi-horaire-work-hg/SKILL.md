---
name: run-suivi-horaire-work-hg
description: Build, run, and drive Suivi horaire (Next.js time-tracking app). Use when asked to start the app, run its dev server, build it, take a screenshot of its UI, log in/register a test account, or interact with the running app (Saisie, Calendrier, Récapitulatif, Export, Paramètres).
---

Suivi horaire is a Next.js 16 (App Router) app backed by PostgreSQL via
Prisma. There's no dedicated test suite or Storybook — driving means
starting the dev server and puppeting a real headless Chromium against
it, since every page requires an authenticated session. `chromium-cli`
isn't installed in this environment, so drive it via
`.claude/skills/run-suivi-horaire-work-hg/driver.mjs`, a small
line-based Playwright REPL that mirrors chromium-cli's vocabulary
(`nav` / `wait-for` / `click` / `fill` / `screenshot` / …).

All paths below are relative to the repo root.

## Prerequisites

PostgreSQL 16 client + server (already present in this container; on a
fresh Ubuntu box):

```bash
sudo apt-get update
sudo apt-get install -y postgresql-16 postgresql-client-16
```

Node 22 (already present). Playwright's browser is pre-installed in this
container at `/opt/pw-browsers/chromium`; the driver uses it
automatically and does **not** run `playwright install`.

## Setup

1. Start Postgres and create a local dev role + database (one-time):

   ```bash
   service postgresql start
   sudo -u postgres psql -c "CREATE USER suivi_dev WITH PASSWORD 'suivi_dev_password';"
   sudo -u postgres psql -c "CREATE DATABASE suivi_horaire OWNER suivi_dev;"
   sudo -u postgres psql -c "ALTER USER suivi_dev CREATEDB;"  # needed for the migrate-dev shadow DB
   ```

   On future container restarts, Postgres just needs starting again:
   `service postgresql start` (the role/database persist on disk).

2. Copy the env template and point it at the local database:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` to:

   ```bash
   NEON_POSTGRES_URL="postgresql://suivi_dev:suivi_dev_password@localhost:5432/suivi_horaire?schema=public"
   NEON_POSTGRES_URL_NON_POOLING="postgresql://suivi_dev:suivi_dev_password@localhost:5432/suivi_horaire?schema=public"
   AUTH_SECRET="$(openssl rand -base64 32)"
   ```

3. Install deps (this also runs `prisma generate` via `postinstall`,
   and pulls in `playwright`, already a devDependency) and apply the
   schema:

   ```bash
   npm install
   npx prisma migrate dev
   ```

## Build

Only needed to sanity-check a production bundle (the agent path below
uses the dev server, not this):

```bash
npm run build   # runs `prisma migrate deploy && next build`
```

## Run (agent path)

1. Start the dev server in the background and wait for it to actually
   serve (don't `sleep` — poll):

   ```bash
   rm -rf .next   # see Gotchas: stale Turbopack cache can corrupt and crash the server
   (npm run dev > /tmp/dev.log 2>&1 &)
   timeout 30 bash -c 'until curl -sf -o /dev/null http://localhost:3000/login; do sleep 1; done'
   ```

   Stop it with `pkill -9 -f "next dev|next-server"` before
   relaunching — killing only the `next dev` launcher leaves the
   detached `next-server` process (and its build worker) running,
   which either grabs the port first on the next run (silently
   shifting every URL below to `:3001`) or races the new process over
   the same `.next` directory and corrupts it (see Gotchas).

2. Drive it with the driver, **one single invocation per logical
   session** (each `node driver.mjs` launches a fresh, separate
   browser — splitting one flow across two invocations loses all
   state, including the login). Every page requires a session, so a
   full run always starts with register-or-login:

   ```bash
   node .claude/skills/run-suivi-horaire-work-hg/driver.mjs <<'EOF'
   nav http://localhost:3000/register
   wait-for input[type="email"]
   wait-ms 800
   fill input[type="email"] demo@example.com
   fill :nth-match(input[autocomplete="new-password"],1) password1234
   fill :nth-match(input[autocomplete="new-password"],2) password1234
   click button[type="submit"]
   wait-for text=Saisie
   screenshot app-saisie
   click text=Calendrier
   wait-ms 500
   screenshot app-calendrier
   click text=Paramètres
   wait-ms 500
   screenshot app-parametres
   quit
   EOF
   ```

   To re-test against an existing account instead of registering a new
   one each time, use the login form (`http://localhost:3000/login`,
   same two fields minus the confirm-password one) and clear test data
   between runs with:

   ```bash
   PGPASSWORD=suivi_dev_password psql -h localhost -U suivi_dev -d suivi_horaire \
     -c 'DELETE FROM "DayEntry"; DELETE FROM "User";'
   ```

Screenshots land in `/tmp/suivi-horaire-screenshots/` (each named shot
plus a `screenshot.png` symlink-equivalent copy of the latest one).
Override the directory with `DRIVER_SCREENSHOT_DIR`.

| driver command | what it does |
|---|---|
| `nav <url>` | navigate |
| `wait-for text=<text>` | wait for text to be visible |
| `wait-for <css-selector>` | wait for selector to be visible |
| `wait-ms <n>` | fixed pause (only for the post-hydration gotcha below — prefer `wait-for`) |
| `click <selector>` | click |
| `fill <selector> <value...>` | fill an input (rest of the line is the value, verbatim — no quoting) |
| `press <key>` | keyboard press, e.g. `press Enter` |
| `screenshot [name]` | full-page PNG to the screenshot dir |
| `text <selector>` | print `textContent` of the first match |
| `url` | print the current page URL |
| `eval <js-expression>` | `page.evaluate()` the expression, print the JSON result |
| `quit` | close the browser and exit |

## Run (human path)

```bash
npm run dev   # → http://localhost:3000, Ctrl-C to stop
```

## Test

No automated test suite exists for this project — `npm run lint` and
`npx tsc --noEmit` are the closest things to CI checks:

```bash
npm run lint
npx tsc --noEmit
```

---

## Gotchas

- **`pkill -f "next dev"` doesn't actually stop the server.** `next
  dev` is a thin launcher; the real work happens in a detached
  `next-server` process (plus a build worker) that the launcher spawns
  and that `pgrep -fa "next dev"` won't match. Leaving it running and
  starting a second instance produces *two* processes racing over the
  same `.next` directory — port 3000 gets reported "in use" (the new
  instance silently shifts to 3001), and the new process can crash
  outright with `Persisting failed: Unable to write SST file … No such
  file or directory` (a corrupted Turbopack RocksDB cache) or `Error:
  Cannot find module '../chunks/ssr/[turbopack]_runtime.js'`
  (`.next/dev/...` files half-written by the other process). Always
  stop with `pkill -9 -f "next dev|next-server"`, confirm with
  `ss -tlnp | grep 300` that the port is actually free, and `rm -rf
  .next` before relaunching if you have any doubt about prior state.
- **One driver invocation = one browser.** `node driver.mjs` launches
  a fresh `chromium` context per process and only tears it down on
  `quit` or stdin close. Running `register` in one invocation and
  `click Calendrier` in a second gets you `about:blank` and a wall of
  timeouts — the second process never saw the first one's login.
  Chain the whole flow into a single heredoc.
- **Fill immediately after `wait-for` on a first-ever page load loses
  the value.** Next.js server-renders the input tag before the page's
  JS has hydrated; `page.fill()` can write the DOM value in that
  window, and then React's hydration reconciles the controlled input
  back to its (still-empty) initial state, silently wiping what was
  just typed — `fill` reports `OK` but the field is empty in the next
  screenshot. Only bites the *first* navigation to a given route (its
  bundle is compiling on demand — see the "Compiling …" line in
  `/tmp/dev.log`); subsequent visits to an already-compiled route
  don't need it. Fix: add `wait-ms 800` between `wait-for` and the
  first `fill` on a freshly-navigated page.
- **Two password fields share `autocomplete="new-password"`** on
  `/register` (password + confirm), so a plain
  `input[autocomplete="new-password"]` selector is ambiguous. The
  driver's `fill` command does simple space-splitting (no shell-style
  quoting), so Playwright's own `>> nth=1` chained-selector syntax
  breaks — the space in it gets parsed as the start of the value.
  Use the space-free CSS extension instead:
  `:nth-match(input[autocomplete="new-password"],1)` /
  `,2)`.
- **Registering the same email twice 409s** and the form just sits on
  `/register` with an inline error — it doesn't throw or navigate.
  Either use a fresh email per run or wipe `"User"`/`"DayEntry"` first
  (command above).

## Troubleshooting

- **`node driver.mjs` prints nothing and exits 0 immediately**: an
  earlier, now-fixed bug in this driver — `readline`'s `close` event
  fires as soon as the heredoc is fully read (near-instantly), which
  raced ahead of the async `nav`/`fill`/etc. handlers and called
  `process.exit(0)` before anything ran. The committed driver queues
  commands and only exits once the queue is drained *and* stdin has
  closed. If you see this symptom again, something re-introduced a
  bare `rl.on("close", () => process.exit(0))`.
- **`ECONNREFUSED` / `curl` never becomes ready**: check `/tmp/dev.log`.
  `Persisting failed: Unable to write SST file` or `Cannot find module
  '../chunks/ssr/[turbopack]_runtime.js'` means a leftover
  `next-server` process is still bound and racing the new one — run
  `pgrep -fa "next-server"`, `kill -9` every PID it lists, confirm with
  `ss -tlnp | grep 300` that nothing's listening, then `rm -rf .next`
  and relaunch.
- **`⚠ Port 3000 is in use by an unknown process, using available port
  3001 instead`** in `/tmp/dev.log`: same root cause as above — a prior
  `next-server` wasn't fully killed. Every URL in this skill assumes
  3000; either kill the leftover process and relaunch, or substitute
  the port `/tmp/dev.log` actually reports.
- **`PrismaClientInitializationError: environment variable not
  found`**: `.env` is missing `NEON_POSTGRES_URL` /
  `NEON_POSTGRES_URL_NON_POOLING` / `AUTH_SECRET`, or Postgres isn't
  running (`service postgresql start`).
