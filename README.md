# Gabriel I. Alonso — portfolio

A static research and creative portfolio at [arthifact.com](https://arthifact.com/), built with Astro. The design uses a paper-like background, serif typography, and a compact homepage with six selected works and a Ponyo still selected randomly on each homepage load. Navigation stays at the top; on phones the works become short rows with thumbnails.

## Run and verify

Use Node 22.18 or newer and npm. The committed lockfile is the source of truth.

```sh
npm ci
npm run dev
npm run check
npm run build
npm run verify:site
npm run preview
```

`npm run build` also builds the Pagefind index and verifies the generated site. The homepage uses one small inline script to choose a Ponyo still; navigation and content also work with JavaScript disabled. The other core pages ship no client JavaScript. All pages use system fonts; there are no external font requests or video players on initial load. The interactive Earth model loads its third-party viewer only after the reader requests it.

The verification command checks every built page for broken local links and anchors, image dimensions, a main heading, the CV, RSS content, and a 24 KiB gzipped HTML budget for the core pages. Gallery checks also exercise all 50 choices, repeat avoidance, unavailable session storage, and fallback behavior. GitHub Actions runs type checks, the production build, and verification on pull requests.

## Add and organize work

Existing project URLs stay under `/projects/<slug>/`, including entries shown in Research or Art. Each item has its own Markdown folder in `src/content/projects/` and a local cover image.

```yaml
---
title: "Your project title"
description: "A concise description of the work."
kind: project # research | project | art
featured: false
publishDate: "2026-10-05"
coverImage:
  src: "./cover.png"
  alt: "Describe what the image shows."
---
```

- `kind` places the item in Research, Projects, or Art.
- `featured: true` puts an item first in the project index.
- Edit the `selected` entries in `src/pages/index.astro` to change the six homepage selections and their short display titles and descriptions. Astro normalizes IDs: the DMesh++ folder becomes `article-exploring-dmesh`.
- Keep covers local. Astro produces responsive WebP images automatically.
- Link to demonstrations and videos from the Markdown. Repository directives such as `::github{repo="arthifact/example"}` render static links.

## Write

Add Markdown posts in `src/content/post/` with `title`, `description`, and `publishDate`; optional fields include `tags`, `coverImage`, and `draft`. Notes live in `src/content/note/`. The Blog and main RSS feed collect published posts, research essays, and notes. A post marked `unlisted: true` keeps its URL but stays out of the blog and feed and receives `noindex` metadata. The original Markdown demo is preserved this way.

## Update identity and design

- Name, description, domain, and navigation: `src/site.config.ts`.
- Homepage role and email: `src/pages/index.astro`.
- Biography and contact links: `src/pages/about.astro`.
- CV: replace `public/files/Gabriel_Isaac_Alonso_Serrato_CV.pdf` when needed.
- Typography, spacing, mobile layout, and print styles: `src/styles/global.css`.
- Sea artwork: `src/components/OceanStill.astro` and `src/assets/ponyo/`. All 50 stills are local, optimized WebP files. A small inline script picks one per homepage load, avoiding the previous frame in the same tab when session storage is available. Only the chosen image is requested; frame 050 is the no-JavaScript and image-error fallback. Image descriptions live in `src/data/ponyo.ts`.
- Social preview: `public/social-card.png`; favicon: `public/icon.svg`.

## Artwork credit

The 50 homepage stills are from [Ponyo (2008), Studio Ghibli’s official gallery](https://www.ghibli.jp/works/ponyo/). © 2008 Hayao Miyazaki/Studio Ghibli, NDHDMT. The gallery provides stills for use within the bounds of common sense. This third-party artwork remains under its original copyright and is not covered by the repository’s software license.

## Deployment

GitHub Pages deploys pushes to `main` through `.github/workflows/deploy.yml`. The custom domain and `CNAME` remain configured. Review a redesign pull request before merging; merging publishes the changes through the existing workflow.

Built from the Astro Cactus foundation. See [LICENSE](LICENSE).
