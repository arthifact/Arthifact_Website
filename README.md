# Arthifact Website (astro-cactus)

Personal/portfolio website built with Astro and Tailwind CSS. This repository contains content (posts, notes, projects) and the site code used to build and deploy a static site.

## Tech stack

- Astro (static site generator)
- Tailwind CSS
- Pagefind for on-site search
- npm for package management (used by CI)
- TypeScript

## Quick start

Prerequisites:

- Node.js (LTS recommended)


This project uses npm (the GitHub Actions CI uses npm). Use the npm commands below to run and build the site locally so behavior matches CI.

Install dependencies:

```bash
npm install
```

Run locally in development mode:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```


Notes: the `postbuild` script runs Pagefind to generate the search index for the built site. After `npm run build`, run the postbuild step to generate the search index:

```bash
# after `npm run build`
npm run postbuild
```

Preview the production build locally:

```bash
npm run preview
```

Available scripts (from `package.json`):

- `dev` / `start` — start Astro in dev mode
- `build` — build the site for production
- `postbuild` — generate Pagefind search index (`pagefind --site dist`)
- `preview` — preview the production build
- `lint` — run Biome linter
- `format` — format code (runs code and imports formatting)
- `check` — run Astro checks

Note about CI package manager

The repository's GitHub Actions workflow (`.github/workflows/ci.yml`) currently uses npm to install and build the project. For best parity with CI, consider using the same package manager locally (npm) when testing CI-related issues. The README above already lists the npm equivalents for all important commands.

## Project structure (important parts)

- `src/` — site source code
  - `components/` — reusable UI components
  - `content/` — markdown content (posts, projects, notes)
  - `layouts/` — page layouts
  - `pages/` — route pages
  - `styles/` — global styles and Tailwind integration
  - `plugins/` — remark/rehype plugins
- `public/` — static assets
- `package.json` — scripts & dependencies
- `astro.config.ts`, `tailwind.config.ts`, `tsconfig.json`

## Deployment

This repository is configured to deploy to **GitHub Pages** using GitHub Actions. If you fork or copy this repository, it should be ready to deploy automatically.

**GitHub Actions workflows:**
- `.github/workflows/deploy.yml` — deploys to GitHub Pages on push to `main`
- `.github/workflows/ci.yml` — runs linting and build checks on PRs and pushes

**Setup instructions:**

1. Fork or copy this repository to your GitHub account.
2. Go to your repository's **Settings → Pages**.
3. Set the source to **"GitHub Actions"** (not a branch).
4. Push to the `main` branch to trigger the deployment.

**Custom domain:**

This repository uses a custom domain from Namecheap. If you want to use your own custom domain:
- Add a `CNAME` file with your domain (already present in this repo).
- Configure DNS settings with your domain provider.

If you don't have a custom domain, GitHub Pages will serve your site at:
- `https://username.github.io/repository-name/` (if the repo is not named `username.github.io`)
- `https://username.github.io/` (if the repo is named `username.github.io`)

You may need to update the `site` config in `astro.config.ts` for deploying properly.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
