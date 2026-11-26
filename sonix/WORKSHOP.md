# Harness Workshop — Quick Start

## Prerequisites

- NodeJS v22.x (install it using Node Version Manager (`nvm` or `nvm-windows`), not the downloader installer from nodejs.org)
- Docker Desktop (have it already running)

## Setup

**Create your `.env` file**

The project needs a `.env` file for Docker and app configuration.
In VS Code's Explorer panel, right-click `.env.example` → **Copy**, then right-click the
same folder → **Paste**, and rename the copy to `.env`. (No changes to the values are needed.)

**In VSCode, create Terminal 1** — run once to initialise everything:
```bash
npm install                             # don't worry about `npm warn` or `deprecated` messages
npm run docker -- up                    # start Logto, PostgreSQL, RavenDB, Mailpit
npm run logto -- logto:db:import-init   # load Logto config (stops/restarts Logto automatically)
npm run logto -- logto:seed             # seed test users & organisations
```

**Create Terminal 2** — start the dev servers and leave them running:
```bash
npm run dev:apis                       # start API (port 3000)
```

**Returning to Terminal 1** — once the API is ready (you'll see `Application is running on: http://localhost:3000`):
```bash
npm run db -- seed                      # create RavenDB database + seed reference data
npm run dev:web                         # start Web UI (port 3004)
```

## Login

| | |
|---|---|
| URL | http://localhost:3004 |
| Email | alice@acme-rv.com |
| Password | xyab12dE |

## Services

| Service | URL |
|---|---|
| Web UI | http://localhost:3004 |
| API | http://localhost:3000 |
| Logto Admin | http://localhost:3002 |
| RavenDB Studio | http://localhost:3333 |
| Mailpit | http://localhost:8025 |

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | Nx |
| Backend | NestJS (TypeScript) |
| Database | RavenDB (document DB) |
| Auth | Logto (OAuth 2.0 / OIDC) |
| Frontend | React 19 + React Router 7 |
| UI | Material UI |
| Infrastructure | Docker Compose |

## Project Structure

```
apps/
  sonix-apis/     NestJS backend API (port 3000)
  client-web/     React frontend (port 5173)
libs/
  shared/
    data-models/  Shared DTOs and types (@dms/data-models)
scripts/          Dev tooling (docker, db, logto, dev server)
docs/standards/   Coding standards — read before writing code
```

## Included Features

- Authentication (sign in / sign out via Logto)
- Locations (list, create, edit)
- Parts inventory (list view)

## What to Build

These features are intentionally omitted — workshop exercises:

- Parts create / edit
- Users list and detail
- Any additional domain you choose
