# Gabriel I. Alonso — portfolio

A static research and creative portfolio at [arthifact.com](https://arthifact.com/), built with Astro. The design uses a paper-like background, serif typography, and a compact homepage with six selected works and a Ponyo still selected randomly on each homepage load. Navigation stays at the top. Selected work keeps the same card layout and 16:9 image frames at every size: three columns above 600px and two on smaller screens.

## Run and verify

Use Node 22.18 or newer and npm. The committed lockfile is the source of truth.

```sh
npm ci
npm run dev
npm run check
npm run test:paper
npm run build
npm run verify:site
npm run preview
```

`npm run build` refreshes the content cache, builds the Pagefind index, and verifies the generated site. The homepage uses one small inline script to choose a Ponyo still; navigation and content also work with JavaScript disabled. The other core pages ship no client JavaScript. Index pages use system fonts; articles use locally hosted STIX Two Text. There are no external font requests or video players on initial load. The interactive Earth model loads its third-party viewer only after the reader requests it.

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

See the live [paper example](https://arthifact.com/posts/paper-example/), also linked at the top of Blog. It uses synthetic data to demonstrate the layout; it is unlisted, excluded from search and RSS, and is not a research entry. The optional figure generation script uses Python, NumPy, and Matplotlib; these are not site build dependencies.

Research writeups, projects, art, posts, and notes use white paper sheets with STIX Two Text, a centered title and author line, an abstract, numbered sections, and fine rules. Each page reads down the left column, then continues from the top of the right. Headings, paragraphs, equations, tables, code, and footnotes share that continuous flow; headings never restart column pairs. A quiet gutter separates the columns. Wide figures can span the sheet above or below its text. Type, margins, and spacing scale smoothly with the sheet width using CSS container units and rem limits, with no layout JavaScript. Phones use one reading column. Covers remain thumbnails on index pages; insert article figures where they belong. Print styles remove navigation, shadows, and borders and respect authored page breaks.

Start from `examples/paper.md` for plain text, math, and tables, or `examples/paper.mdx` for captioned figures and paired panels. Copy it into `src/content/post/<slug>/index.md` (or `.mdx`), set the title, summary, and date, and write the body. Remove `unlisted: true` when you want it in the blog and RSS. For a project, use `src/content/projects/<slug>/index.mdx` with `kind: research`, `project`, or `art`. Authors default to Gabriel I. Alonso; add an `authors` array for coauthors.

Optional frontmatter:

```yaml
format: paper
abstract: "The question, method, and main result in one paragraph."
numberedSections: true
columns: 2 # The default paper layout; use 1 for a single reading column.
authors: ["Gabriel I. Alonso", "Coauthor"]
affiliation: "Your institution"
pdf: "/files/your-paper.pdf"
```

`abstract` replaces the description with a manuscript abstract below the title. `columns` defaults to 2 for a continuous paper flow, down the left column and back to the top of the right; 1 remains available for a single reading column. `numberedSections` numbers level-two headings while preserving their anchors; footnotes are not numbered as a section. `pdf` adds a download link: place a PDF in `public/files/` or use an HTTPS URL. Existing PDF papers can accompany the readable HTML article.

Short pieces use one sheet by default. To start another sheet in MDX, import `PageBreak` from `@/components/paper/PageBreak.astro` and insert `<PageBreak />` on its own line between sections. Plain Markdown uses `<div data-paper-break></div>` on its own line. Page numbers are automatic, and section numbers, equation anchors, and footnotes continue through the document. Sheets have paper proportions on desktop and grow when necessary; content is never clipped or shrunk to fit. Breaks are chosen by the author rather than measured by browser JavaScript.

In MDX, import `Figure`, `FigureGrid`, and `Table` from `@/components/paper/`. For a local raster image, import it from the article folder and pass it as `src`; Astro generates responsive WebP variants. SVG plots use a local `/images/...svg` path with explicit `width` and `height`. Always supply meaningful `alt` text. `Figure` takes `id`, `number`, and either `caption` or a rich Markdown caption in its body. Wide figures and Markdown images span both columns. Place them before or after a sheet's text to keep one continuous column pair on that page. Use `wide={false}` on `Figure` to keep a figure inside a text column. Use `captionPosition="side"` for a caption beside the image; it moves below the image on phones. Wrap two figures in `<FigureGrid>` for equal panels, or `<FigureGrid layout="lead">` for a large image with a smaller supporting panel. Keep sections of writing, code, and tables sequential in the body; they stay in the column flow. Use `FigureGrid` for image panels. Image groups stack on phones. Use `maxWidth={640}` to center a smaller figure on the sheet. Figures keep their original proportions and captions stay with their image. Clicking a figure opens the original image at full size. The optional `sizes` prop can refine responsive raster selection for custom placements.

`Table` takes `id`, `number`, and `caption`, with a Markdown or HTML table inside. Tables retain native headers and fine horizontal rules; wide tables scroll in a labelled region that readers can focus with the keyboard. Code fences are highlighted during the build. Headings, links, lists, citations as links, and Markdown footnotes work normally.

LaTeX equations work in both `.md` and `.mdx`: use `$x^2$` inline or `$$` on separate lines around a display equation. Add `\tag{1}` inside an equation for a number. Put `<div id="eq-energy" />` before an MDX equation and link to it with `[Equation (1)](#eq-energy)` for a cross-reference. KaTeX renders HTML and MathML during the build, so the reader needs no math JavaScript. Math styles and fonts are local and linked only on articles containing equations, with font swapping enabled. Wide display equations scroll within the reading column and can be focused with the keyboard. Unsupported or invalid equations fail the build; use [KaTeX’s supported commands](https://katex.org/docs/supported). Write web articles in Markdown/MDX with LaTeX math; attach complete `.tex` manuscripts as compiled PDFs.

## Update identity and design

- Name, description, domain, and navigation: `src/site.config.ts`.
- Homepage role and email: `src/pages/index.astro`.
- Biography and contact links: `src/pages/about.astro`.
- CV: replace `public/files/Gabriel_Isaac_Alonso_Serrato_CV.pdf` when needed.
- Site design: `src/styles/global.css`. Article typography, figures, tables, mobile layout, and print styles: `src/styles/paper.css`.
- Sea artwork: `src/components/OceanStill.astro` and `src/assets/ponyo/`. All 50 stills are local, optimized WebP files. A small inline script picks one per homepage load, avoiding the previous frame in the same tab when session storage is available. Only the chosen image is requested; frame 050 is the no-JavaScript and image-error fallback. Image descriptions live in `src/data/ponyo.ts`.
- Torus logo and SVG favicon: `public/logo.svg`, used in the header through `src/components/Logo.astro`. The homepage header shows only the logo; the full name appears once in the introduction. Other pages retain the logo and short name in the header. Regenerate the projected torus mesh and matching `public/icons/apple-touch-icon.png` with `node scripts/generate-logo.mjs`.
- Social preview: `public/social-card.png`.

## Artwork credit

The 50 homepage stills are from [Ponyo (2008), Studio Ghibli’s official gallery](https://www.ghibli.jp/works/ponyo/). © 2008 Hayao Miyazaki/Studio Ghibli, NDHDMT. The gallery provides stills for use within the bounds of common sense. This third-party artwork remains under its original copyright and is not covered by the repository’s software license.

## Deployment

GitHub Pages deploys pushes to `main` through `.github/workflows/deploy.yml`. The custom domain and `CNAME` remain configured. Review a redesign pull request before merging; merging publishes the changes through the existing workflow.

Built from the Astro Cactus foundation. See [LICENSE](LICENSE).

The locally hosted [STIX Two Text](https://fontsource.org/fonts/stix-two-text) font is by the STIX Fonts Project Authors and is distributed under the SIL Open Font License 1.1, included in the installed `@fontsource/stix-two-text` package.
