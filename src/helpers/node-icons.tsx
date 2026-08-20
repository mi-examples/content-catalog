import type { ReactNode } from 'react';

/**
 * Icons for the hierarchy nodes in the sidebar and the overview cards.
 * Folders always use the folder glyph; categories use whichever candidate is
 * selected in CATEGORY_ICON_ID below.
 */

const glyph = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const FolderIcon = () => (
  <svg {...glyph}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
  </svg>
);

/* ---- category icon candidates ------------------------------------------ */

const TagIcon = () => (
  <svg {...glyph}>
    <path d="M20.5 13.5 13 21a2 2 0 0 1-2.8 0L3 13.8V4h9.8l7.7 7.7a2 2 0 0 1 0 1.8Z" />
    <circle cx="8" cy="9" r="1.4" />
  </svg>
);

const LayersIcon = () => (
  <svg {...glyph}>
    <path d="m12 3 8.5 4.5L12 12 3.5 7.5 12 3Z" />
    <path d="m4 12.5 8 4.2 8-4.2" />
    <path d="m4 17 8 4.2 8-4.2" />
  </svg>
);

const GridIcon = () => (
  <svg {...glyph}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.4" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.4" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.4" />
  </svg>
);

const BookmarkIcon = () => (
  <svg {...glyph}>
    <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4.2L5 20V5a1 1 0 0 1 1-1Z" />
  </svg>
);

const HashIcon = () => (
  <svg {...glyph}>
    <path d="M9.5 3.5 7.5 20.5" />
    <path d="M16.5 3.5 14.5 20.5" />
    <path d="M3.5 9h17" />
    <path d="M3 15h17" />
  </svg>
);

const CollectionIcon = () => (
  <svg {...glyph}>
    <rect x="3.5" y="8.5" width="17" height="12" rx="2" />
    <path d="M6 5.5h12" />
    <path d="M8 2.8h8" />
  </svg>
);

const ShapesIcon = () => (
  <svg {...glyph}>
    <circle cx="8" cy="8" r="4.5" />
    <rect x="12.5" y="12.5" width="8" height="8" rx="1.4" />
    <path d="M16.5 3.2 20.8 10h-8.6Z" />
  </svg>
);

const SitemapIcon = () => (
  <svg {...glyph}>
    <rect x="9" y="3" width="6" height="5" rx="1.2" />
    <rect x="2.5" y="16" width="6" height="5" rx="1.2" />
    <rect x="15.5" y="16" width="6" height="5" rx="1.2" />
    <path d="M12 8v4" />
    <path d="M5.5 16v-2.5h13V16" />
  </svg>
);

const TargetIcon = () => (
  <svg {...glyph}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.8" />
    <circle cx="12" cy="12" r="1.4" />
  </svg>
);

const BookIcon = () => (
  <svg {...glyph}>
    <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H11v18H5.5A1.5 1.5 0 0 1 4 19.5Z" />
    <path d="M20 4.5A1.5 1.5 0 0 0 18.5 3H13v18h5.5A1.5 1.5 0 0 0 20 19.5Z" />
  </svg>
);

export interface CategoryIconOption {
  id: number;
  name: string;
  Icon: () => ReactNode;
}

/** The ten candidates; pick one and set CATEGORY_ICON_ID to its id. */
export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { id: 1, name: 'Tag', Icon: TagIcon },
  { id: 2, name: 'Layers', Icon: LayersIcon },
  { id: 3, name: 'Grid', Icon: GridIcon },
  { id: 4, name: 'Bookmark', Icon: BookmarkIcon },
  { id: 5, name: 'Hash', Icon: HashIcon },
  { id: 6, name: 'Collection', Icon: CollectionIcon },
  { id: 7, name: 'Shapes', Icon: ShapesIcon },
  { id: 8, name: 'Sitemap', Icon: SitemapIcon },
  { id: 9, name: 'Target', Icon: TargetIcon },
  { id: 10, name: 'Book', Icon: BookIcon },
];

/**
 * Which candidate the app uses for categories and subcategories.
 * Change this one value to switch the icon everywhere.
 */
export const CATEGORY_ICON_ID = 7;

export const CategoryIcon = () => {
  const option =
    CATEGORY_ICON_OPTIONS.find((candidate) => candidate.id === CATEGORY_ICON_ID) ??
    CATEGORY_ICON_OPTIONS[0];

  return <option.Icon />;
};

/** Node glyph for the active content source. */
export const NodeIcon = ({ source }: { source: 'folders' | 'categories' }) =>
  source === 'folders' ? <FolderIcon /> : <CategoryIcon />;
