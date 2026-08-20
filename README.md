# Content Catalog

A Metric Insights custom app (Portal Page) that turns your Folders or Categories into a
browsable catalog: a collapsible menu of the content a user can see, and an embedded viewer
that opens each element in place.

- **Folders or Categories** — one Portal Page variable picks which hierarchy to show.
- **Collapsible menu** — subfolders and their reports nested underneath, collapsing to a
  72px icon rail, or an overlay drawer on narrow screens.
- **Overview** — a tile per top-level folder with its subfolder and report counts, plus a card
  listing the user's favorites.
- **Element viewer** — opens in the main pane with a breadcrumb, favorite toggle, copy-link
  and a details card.
- **Themed** — colors, type and shape come from CSS custom properties, with a light and a dark
  set.

Built with [pp-dev](https://www.npmjs.com/package/@metricinsights/pp-dev),
[@metricinsights/pp-components](https://www.npmjs.com/package/@metricinsights/pp-components),
React and TypeScript.

## Requirements

- Node.js 18 or newer
- A Metric Insights instance you can reach, and an account on it
- A Portal Page on that instance to hold this app's variables

## Setup

```bash
npm install
```

Point the app at your instance in `pp-dev.config.ts`:

```ts
backendBaseURL: 'https://your-instance.metricinsights.com',
```

Then create a Portal Page in Metric Insights (**Content > Portal Pages**), add the variables
from the table below, and put its ID and a Personal Access Token in `.env`:

```bash
cp .env.example .env
```

```
MI_ACCESS_TOKEN=your-token
MI_APP_ID=42
```

Start the dev server:

```bash
npm run dev
```

pp-dev prints the URL to open (`http://localhost:3000/pl/<page-name>`) and proxies API calls
to your instance. Without a token — or an active session in the same browser — those calls
return 401 and the app says so.

To explore the UI with no instance at all, run it against the bundled sample data:

```bash
npm run dev:fixtures   # http://localhost:3001
```

## Portal Page variables

All of them are optional — each falls back to a sensible default.

| Variable | Purpose | Default |
| --- | --- | --- |
| `Content Source` | `folders` or `categories` | `folders` |
| `Welcome Message` | Replaces the time-based greeting prefix | "Good morning/afternoon/evening" |
| `Hero Subtext` | Line under the greeting | generic browse message |
| `Hero Image` | Hero background image | brand gradient |
| `Logo` | Logo in the hero | bundled logo |
| `Sidebar Logo` | Logo in the menu header | falls back to `Logo` |
| `Hide Empty Nodes` | `Y`/`N` — hide folders with no accessible content | `Y` |

Image variables accept a URL or the `<img src="…">` tag that MI's image-type variables
produce.

## Deploying

```bash
npm run build
```

This writes `dist/` and `dist-zip/mi-content-catalog.zip`. Upload the zip to your Portal Page
in Metric Insights.

## Making it yours

- **Colors and type** — `src/assets/styles/_tokens.scss` holds the whole palette as CSS custom
  properties. Replace the values there and every component follows, including dark mode
  (`data-theme="dark"` on `<html>`).
- **Logos** — drop your files in `public/logos` and point the `Logo` / `Sidebar Logo`
  variables at them, or edit the defaults in `src/helpers/logos.ts`.
- **Icons** — `src/helpers/node-icons.tsx` and `src/helpers/share-icons.tsx` each ship a set of
  alternatives; switch the `*_ICON_ID` constant at the bottom of the file.

The bundled theme and logos are Truist-derived and are there as a worked example — swap them
for your own branding before shipping to users.

## What it reads from Metric Insights

Read-only, as the signed-in user, except for toggling favorites:

| Endpoint | Used for |
| --- | --- |
| `GET /index/index/user-info` | the name in the greeting |
| `GET /api/folder`, `GET /api/folder_element` | the folder hierarchy and its contents |
| `GET /api/category`, `GET /api/element` | the category hierarchy and its contents |
| `GET`/`POST`/`DELETE /api/favorite_element`, `GET /api/favorite` | reading and toggling favorites |
| `/service/iframe/index/type/short/element/…` | the embedded element viewer |

## Notes

- `@metricinsights/pp-dev` is pinned to `0.10.x`. Version `0.12` and later require Node 24 and
  use a different config schema — run `npx @metricinsights/pp-dev migrate` if you upgrade.
- More detail on how the app is built: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).
