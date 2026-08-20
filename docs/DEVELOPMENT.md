# Development notes

Implementation detail behind the app — how the sidebar, overview, viewer and theme are put
together, and which Metric Insights endpoints each part uses. For installation and
configuration, see the [README](../README.md).

Paths in this document are relative to the repository root.

## Running locally

```bash
npm install
cp .env.example .env   # then fill in MI_ACCESS_TOKEN and MI_APP_ID
npm run dev
```

pp-dev serves on <http://localhost:3000/pl/mi-content-catalog> and proxies `/api/*` to the
instance in `pp-dev.config.ts`. The proxy needs authentication: either a Personal Access
Token in `MI_ACCESS_TOKEN`, or an MI session in the same browser. Without it the API returns
401 and the app shows its "Content could not be loaded" state.

To work on the UI with no instance and no session at all, use the bundled fixtures:

```bash
npm run dev:fixtures   # serves on http://localhost:3001
```

## Configuration

`MI_APP_ID` (read by `pp-dev.config.ts`) must be the Portal Page that holds this app's
Variables. pp-dev reads that page and substitutes the `[Variable Name]` placeholders declared
in `index.html`. While `MI_APP_ID` is unset the dev server runs template-less and every
variable falls back to its default.

| Portal Page Variable | Purpose | Default when unset |
| --- | --- | --- |
| `Content Source` | `folders` or `categories` — which hierarchy to render | `folders` |
| `Welcome Message` | Replaces the time-based greeting prefix | "Good morning/afternoon/evening" |
| `Hero Subtext` | Sub-text under the greeting | generic browse message |
| `Hero Image` | Hero background image | brand gradient |
| `Logo` | Logo shown in the hero | none |
| `Sidebar Logo` | Logo shown in the sidebar header | falls back to `Logo`, then a wordmark |
| `Hide Empty Nodes` | `Y`/`N` — drop folders/categories with no accessible content | `Y` |

A placeholder that is never substituted (e.g. the variable does not exist on the page) is
treated as unset — see `ppVar()` in `src/constants.ts`.

### Brand logos

The four Truist lockups live in `public/logos`, so they are copied verbatim into `dist/logos`
and into the dist zip's template assets at stable, unhashed paths. Referenced through
`BASE_URL` in [logos.ts](../src/helpers/logos.ts), which resolves to `/p/<page>/logos/…` in a
build and `/pl/<page>/logos/…` under pp-dev:

| File | Used as |
| --- | --- |
| `truist-logo-white-full.svg` | hero default (over the dark banner) |
| `truist-logo-purple.svg` | sidebar default, expanded |
| `truist-logo-purple-mark.svg` | sidebar default, collapsed rail |
| `truist-logo-white-mark.svg` | spare square mark for dark surfaces |

These are only defaults — the `Logo` / `Sidebar Logo` variables override them. In dark mode the
sidebar lockup is inverted to white in CSS, since the purple mark would disappear against the
dark surface. `truist-logo-purple.svg` shipped without a `viewBox`, which made CSS sizing
letterbox it rather than scale; a `viewBox="0 0 200 80"` (matching the white lockup's
coordinate space) was added.

**Image variables** (`Hero Image`, `Logo`, `Sidebar Logo`) accept either a bare URL or the
full `<img src="…">` tag that MI's image-type variables substitute — `ppVarImage()` pulls the
`src` out of markup, since the raw tag silently breaks both `<img src>` and
`background-image: url(…)`. The sidebar's collapsed rail is only 72px wide, so a compact
square mark works best for `Sidebar Logo`; a wide wordmark is scaled down to fit.

## Navigation sidebar

Modelled on the `page-sidebar` component of `showcase-catalog`, built on
`@metricinsights/pp-components`' `Sidebar`:

- **Header** — a collapse control plus the `Logo` variable (falling back to a wordmark);
  clicking the logo returns to the overview.
- **Docked / rail** — above 1106px the sidebar is docked and the header control collapses it
  to a 72px icon rail. In the rail, names, arrows and element lists are hidden and hovering an
  item shows its name in a tooltip. Picking anything from the rail — Show All, Favorites, a
  folder or a category — reopens the sidebar so the selection's contents are visible.
- **Overlay drawer** — at 1106px and below the sidebar becomes a fixed overlay with a scrim,
  opened by the hamburger in the hero and closed by the header's X, the scrim, or by picking
  anything in it.
- **Nodes** — folders and subfolders use the folder glyph, categories and subcategories the
  glyph selected in [node-icons.tsx](../src/helpers/node-icons.tsx) (`CATEGORY_ICON_ID`; ten
  candidates ship in `CATEGORY_ICON_OPTIONS`). Everything starts **collapsed**; the selected
  node is highlighted. The source (folders vs categories) is deliberately not labelled.
- **Elements** — nested under their node, name only, no icon. Left click opens the element;
  right click opens a context menu with **Open in new tab**.
- **Show All** — always the selection on load, whatever the URL carries; clears the selection
  and shows the overview.
- **Favorites** — a nav item that expands to the user's favorited reports and opens the
  favorites card in the main pane.

The tooltip and context menu render into the `#portal-container-tooltip` anchor in
`src/app.tsx`.

## Theme

The palette, radii, shadows and type from `TruistTheme/truist-theme.css` live as CSS custom
properties in [_tokens.scss](../src/assets/styles/_tokens.scss), with SCSS aliases in
[_vars.scss](../src/assets/styles/_vars.scss) that resolve to `var()` references — so components
follow the runtime theme rather than baking in colours.

- **Light is the default.** Setting `data-theme="dark"` on `<html>` switches the whole app to
  the theme's dark tokens; `data-theme="light"` pins it light.
- `--action-primary-bg` / `--action-primary-text` drive active states and brand-coloured
  glyphs, because Truist Purple has too little contrast on the dark surfaces.
- `@media (prefers-color-scheme: dark)` only sets `color-scheme`, matching the source theme.
  To follow the OS preference automatically, copy the `[data-theme='dark']` token block into
  that media query.
- pp-components injects its own hard-coded `#fff` / `#e0e0e0` / `#222` / `#f4f4f4`, so the
  sidebar and info-popup modules re-apply the tokens over those rules.
- Fonts load from Google Fonts via `index.html`. If the MI instance blocks that, the stacks
  fall back to system faces with no layout change.

## Show All overview

[catalog-overview.tsx](../src/components/catalog-overview/catalog-overview.tsx) is what the app
opens on, and where Show All returns to:

- One **tile per top-level folder/category** with its direct subfolder/subcategory count and
  the number of reports in its whole subtree. Clicking a tile selects that node **and opens it
  in the sidebar**, expanding the sidebar first if it is collapsed to the rail.
- A **Favorites card** listing the user's actual favorited reports with their content type;
  clicking one opens it in the viewer. Selecting Favorites in the sidebar shows this card on
  its own.

## Element viewer

Clicking an element in the menu opens [element-viewer.tsx](../src/components/element-viewer/element-viewer.tsx)
in the main pane — there is no tile grid; the menu is the only way in.

Only the open element is mirrored to the URL (`?element=<id>_<segment>`) — that is what the
share button hands out, and a shared link rebuilds its breadcrumb from whichever node holds
the element. The selected folder is in-session state, so a reload always returns to Show All.

- **Breadcrumb** of the folder/category path plus the element name.
- **Favorite** — toggles membership in the user's `My Favorites` folder via
  `GET /api/favorite` + `POST`/`DELETE /api/favorite_element`.
- **Share** — copies a deep link (`?element=<id>_<segment>`, or the external report URL) and
  confirms in a transient tooltip, falling back to an `execCommand` copy where the async
  Clipboard API is blocked. The glyph comes from `SHARE_ICON_ID` in
  [share-icons.tsx](../src/helpers/share-icons.tsx) (ten candidates in `SHARE_ICON_OPTIONS`).
- **Info** — hovering (or clicking) opens [element-info-popup](../src/components/element-info-popup/element-info-popup.tsx):
  certification line, description, business/technical owner and data steward as mailto links,
  and the view count. Certified elements swap the info glyph for a certificate tinted with
  `certification_level_color`. The card is scrollable, so it **stays open** once shown — moving
  the pointer away does not dismiss it. It closes on its close button, Escape, a click outside
  it, clicking the info control again, or opening a different element.
- **Open in new tab** / **Close**.

External reports whose `external_report_display` is `external` open in a new tab instead of
the embedded viewer.

## Metric Insights endpoints used

| Endpoint | Used for |
| --- | --- |
| `GET /index/index/user-info` | greeting name |
| `GET /api/folder` | folder hierarchy (`parent_folder_id`) |
| `GET /api/folder_element` | elements + `folder_items` folder→element mapping |
| `GET /api/category` | category hierarchy (`parent_category_id`) |
| `GET /api/element` | elements, each carrying `category_id` |
| `GET /api/favorite` | the user's `My Favorites` folder |
| `GET/POST/DELETE /api/favorite_element` | reading and toggling favorites |
| `/service/iframe/index/type/short/element/{id}/segment/{seg}` | element viewer (`VIEWER_IFRAME_TYPE`) |
| `/extcontent/index/preview/element/{id}/segment/{seg}` | `other external content` viewer |

## Toolchain note

`@metricinsights/pp-dev` is pinned to `0.10.x`. Versions `>= 0.12` (which add the global
authentication provider) require **Node.js 24+**. Install Node 24 before upgrading, and run
`npx @metricinsights/pp-dev migrate` — the 1.x config schema is different
(`mi: { url, token }` / `app: { id }`).

## Build

```bash
npm run build
```

Produces `dist/` and `dist-zip/mi-content-catalog.zip`; upload the zip to the Portal Page in
Metric Insights.
