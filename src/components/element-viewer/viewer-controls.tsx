import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ElementFavorite } from '@metricinsights/pp-components';

import {
  addElementToFavorite,
  deleteFavoriteElement,
  useFavoriteElements,
  useFavoriteFolder,
} from '../../api/favorites';
import { copyToClipboard } from '../../helpers/clipboard';
import { ShareIcon } from '../../helpers/share-icons';
import { elementKey } from '../../helpers/tree';
import ElementInfoPopup, { type Position } from '../element-info-popup/element-info-popup';
import type { MIElement } from '../../types';

import styles from './element-viewer.module.scss';

const DEFAULT_CERTIFIED_COLOR = '#1e7a5a';

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 8h.01" />
  </svg>
);

const CertificateIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" style={{ stroke: color }}>
    <circle cx="12" cy="9" r="6" />
    <path d="M9 14.5 8 22l4-2 4 2-1-7.5" />
    <path d="m9.5 9 1.8 1.8L15 7.5" />
  </svg>
);

/**
 * Favorite / share / info controls for the open element. These used to live in
 * the tile header; with the tiles gone the viewer header is their home.
 */
const ViewerControls = ({ element }: { element: MIElement }) => {
  const key = elementKey(element.element_id, element.segment_value_id);
  const accessible = element.has_access === 'Y';

  const { data: favoriteFolder } = useFavoriteFolder();
  const { data: favoriteElements } = useFavoriteElements(favoriteFolder?.id);

  const infoRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLButtonElement>(null);
  const shareTimer = useRef<number | undefined>(undefined);

  const [infoPosition, setInfoPosition] = useState<Position>({ left: 0, top: 0 });
  const [showInfo, setShowInfo] = useState(false);
  const [share, setShare] = useState<{ position: Position; message: string } | null>(null);

  const portalContainer = document.getElementById('portal-container-tooltip');

  const inFavorites = useMemo(
    () =>
      !!favoriteElements?.some(
        (favorite) =>
          Number(favorite.element_id) === element.element_id &&
          Number(favorite.segment_value_id ?? 0) === (element.segment_value_id ?? 0),
      ),
    [favoriteElements, element],
  );

  const certified = element.certified_ind === 'Y';
  const certificateColor = certified
    ? element.certification_level_color || DEFAULT_CERTIFIED_COLOR
    : 'transparent';

  useEffect(() => () => window.clearTimeout(shareTimer.current), []);

  // Close the info card when the open element changes
  useEffect(() => setShowInfo(false), [key]);

  const onFavoriteChange = useCallback(
    async (favorite: boolean) => {
      if (!favoriteFolder || favorite === inFavorites) {
        return;
      }

      const segment = element.segment_value_id ?? 0;

      if (favorite) {
        await addElementToFavorite(favoriteFolder.id, element.element_id, segment);
      } else {
        await deleteFavoriteElement(favoriteFolder.id, element.element_id, segment);
      }
    },
    [favoriteFolder, inFavorites, element],
  );

  const openInfo = () => {
    const rect = infoRef.current?.getBoundingClientRect();

    if (rect) {
      setInfoPosition({ left: rect.right - 300, top: rect.bottom + 8 });
    }

    setShowInfo(true);
  };

  const onShare = async () => {
    const rect = shareRef.current?.getBoundingClientRect();
    const position = rect ? { left: rect.right - 200, top: rect.bottom + 8 } : { left: 0, top: 0 };

    const url = element.external_report_url?.length
      ? element.external_report_url
      : (() => {
          const next = new URL(window.location.href);

          next.searchParams.set('element', key);

          return next.toString();
        })();

    const copied = await copyToClipboard(url);

    setShare({
      position,
      message: copied ? 'Link copied to clipboard' : 'Copying is blocked in this browser',
    });

    window.clearTimeout(shareTimer.current);
    shareTimer.current = window.setTimeout(() => setShare(null), 1800);
  };

  return (
    <>
      {accessible && favoriteFolder ? (
        <ElementFavorite
          initialFavorite={inFavorites}
          onFavoriteChange={onFavoriteChange}
          className={styles.viewer__favorite}
        />
      ) : null}

      <button
        ref={shareRef}
        type="button"
        className={styles.viewer__icon}
        onClick={onShare}
        title="Copy a link to this content"
        aria-label="Copy a link to this content"
      >
        <ShareIcon />
      </button>

      <div
        ref={infoRef}
        className={styles.viewer__icon}
        onMouseEnter={openInfo}
        onClick={() => (showInfo ? setShowInfo(false) : openInfo())}
        title={certified ? element.certification_level_name ?? 'Certified' : 'Details'}
      >
        {certified ? <CertificateIcon color={certificateColor} /> : <InfoIcon />}
      </div>

      {portalContainer && share
        ? createPortal(
            <div
              className={styles.viewer__shareTooltip}
              style={{ left: share.position.left, top: share.position.top }}
            >
              {share.message}
            </div>,
            portalContainer,
          )
        : null}

      {portalContainer
        ? createPortal(
            <ElementInfoPopup
              element={element}
              position={infoPosition}
              show={showInfo}
              onClose={() => setShowInfo(false)}
              triggerRef={infoRef}
            />,
            portalContainer,
          )
        : null}
    </>
  );
};

export default ViewerControls;
