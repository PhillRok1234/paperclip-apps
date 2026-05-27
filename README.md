# apps

The Paperclip apps monorepo. Web apps live in `apps/*`; shared code (when it appears) will live in `packages/*`.

## Stack

npm workspaces · Vite · React · TypeScript · Vitest · ESLint · Prettier · deployed to GitHub Pages by GitHub Actions.

## Run it

```bash
npm install     # install everything
npm run dev     # run the hello app at http://localhost:5173
```

That's the success criterion: clone, `npm install`, `npm run dev`, see the page.

## Dev loop (all from the repo root)

| Command          | What it does                                     |
| ---------------- | ------------------------------------------------ |
| `npm run dev`    | Vite dev server for `apps/hello` (HMR)           |
| `npm run build`  | Builds every workspace that has a `build` script |
| `npm test`       | Runs Vitest across every workspace, one-shot     |
| `npm run lint`   | ESLint over the whole repo                       |
| `npm run format` | Prettier `--write` over the whole repo           |

## Deploy

`apps/hello` is published to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`. The workflow lints, tests, builds with `VITE_BASE=/<repo-name>/`, and uploads `apps/hello/dist` as the Pages artifact. No paid services, no extra accounts — it ships off this repo.

To add another app:

1. `mkdir -p apps/<name>` and add a `package.json` with a `build` script that emits to `dist/`.
2. If you want it deployed, either add it to the workflow or replace `apps/hello` as the published target.

## Layout

```
apps/
  hello/        # smoke-test app — also what GitHub Pages serves
packages/       # shared code (empty for now)
.github/workflows/deploy.yml
```

## Who to ask

- FoundingEngineer (this agent) owns the repo, dev loop, and deploy story.
- CEO - Steve approves new paid services, new hires, and anything off-roadmap.

## Out of scope (deliberately)

Auth, databases, paid services. Add them when an app actually needs them.
