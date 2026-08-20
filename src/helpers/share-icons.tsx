import type { ReactNode } from 'react';

/**
 * Candidates for the viewer's "copy a link" control.
 * Set SHARE_ICON_ID to the one you want; the rest stay here for later.
 */

const glyph = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const ShareNodesIcon = () => (
  <svg {...glyph}>
    <circle cx="18" cy="5" r="2.6" />
    <circle cx="6" cy="12" r="2.6" />
    <circle cx="18" cy="19" r="2.6" />
    <path d="m8.3 10.7 7.4-4.3" />
    <path d="m8.3 13.3 7.4 4.3" />
  </svg>
);

const LinkIcon = () => (
  <svg {...glyph}>
    <path d="M9.5 14.5 14.5 9.5" />
    <path d="M11 6.6 12.8 4.8a4 4 0 0 1 5.7 5.7l-1.8 1.8" />
    <path d="M13 17.4l-1.8 1.8a4 4 0 0 1-5.7-5.7l1.8-1.8" />
  </svg>
);

const CopyIcon = () => (
  <svg {...glyph}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M15 6.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h1.5" />
  </svg>
);

const UploadTrayIcon = () => (
  <svg {...glyph}>
    <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
    <path d="M12 15V3" />
    <path d="m8 7 4-4 4 4" />
  </svg>
);

const ForwardArrowIcon = () => (
  <svg {...glyph}>
    <path d="M14 5l7 7-7 7" />
    <path d="M21 12H9a6 6 0 0 0-6 6v2" />
  </svg>
);

const PaperPlaneIcon = () => (
  <svg {...glyph}>
    <path d="M21.5 3.5 2.5 10.2l6.4 2.9 2.9 6.4Z" />
    <path d="M21.5 3.5 8.9 13.1" />
  </svg>
);

const BroadcastIcon = () => (
  <svg {...glyph}>
    <path d="M4.5 11a8.5 8.5 0 0 1 8.5 8.5" />
    <path d="M4.5 5.5A14 14 0 0 1 18.5 19.5" />
    <circle cx="5.2" cy="18.8" r="1.7" />
  </svg>
);

const SignalIcon = () => (
  <svg {...glyph}>
    <path d="M12 19.8h.01" />
    <path d="M8.6 16.4a4.8 4.8 0 0 1 6.8 0" />
    <path d="M5.6 13a9 9 0 0 1 12.8 0" />
    <path d="M2.6 9.6a13.2 13.2 0 0 1 18.8 0" />
  </svg>
);

const SharePersonIcon = () => (
  <svg {...glyph}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <path d="M17 8h5" />
    <path d="m19.5 5.5 2.5 2.5-2.5 2.5" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg {...glyph}>
    <path d="M14 3h7v7" />
    <path d="M21 3l-9 9" />
    <path d="M19 14v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
  </svg>
);

export interface ShareIconOption {
  id: number;
  name: string;
  Icon: () => ReactNode;
}

export const SHARE_ICON_OPTIONS: ShareIconOption[] = [
  { id: 1, name: 'Share nodes', Icon: ShareNodesIcon },
  { id: 2, name: 'Link', Icon: LinkIcon },
  { id: 3, name: 'Copy', Icon: CopyIcon },
  { id: 4, name: 'Upload tray', Icon: UploadTrayIcon },
  { id: 5, name: 'Forward arrow', Icon: ForwardArrowIcon },
  { id: 6, name: 'Paper plane', Icon: PaperPlaneIcon },
  { id: 7, name: 'Broadcast', Icon: BroadcastIcon },
  { id: 8, name: 'Signal', Icon: SignalIcon },
  { id: 9, name: 'Share with person', Icon: SharePersonIcon },
  { id: 10, name: 'External link', Icon: ExternalLinkIcon },
];

/**
 * Which candidate the share control uses.
 * Change this one value to switch the icon.
 */
export const SHARE_ICON_ID = 1;

export const ShareIcon = () => {
  const option =
    SHARE_ICON_OPTIONS.find((candidate) => candidate.id === SHARE_ICON_ID) ??
    SHARE_ICON_OPTIONS[0];

  return <option.Icon />;
};
