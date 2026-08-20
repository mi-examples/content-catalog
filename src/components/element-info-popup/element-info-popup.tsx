import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { InfoPopup, type InfoPopupSection } from '@metricinsights/pp-components';
import clsx from 'clsx';

import type { MIElement } from '../../types';

import styles from './element-info-popup.module.scss';

export type Position = { left: number; top: number };

type ElementInfoPopupProps = {
  element: MIElement;
  position: Position;
  show: boolean;
  onClose: () => void;
  /** The control that opened the card; clicks on it must not count as "outside". */
  triggerRef?: RefObject<HTMLElement | null>;
};

const DEFAULT_CERTIFIED_COLOR = '#1e7a5a';
const MARGIN = 12;

const UserIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);

const EngagementIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
    <circle cx="12" cy="12" r="2.5" />
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
 * Metadata card for the open element.
 *
 * Once shown it stays put — it is scrollable, so it must not vanish when the
 * pointer leaves the control on the way to it. Dismissal is explicit: the close
 * button, Escape, or a click outside the card.
 */
const ElementInfoPopup = (props: ElementInfoPopupProps) => {
  const { element, position, show, onClose, triggerRef } = props;

  const ref = useRef<HTMLDivElement>(null);
  const [clamped, setClamped] = useState<Position>(position);

  const certified = element.certified_ind === 'Y';
  const certificateColor = certified
    ? element.certification_level_color || DEFAULT_CERTIFIED_COLOR
    : 'transparent';

  const sections = useMemo(() => {
    const result: InfoPopupSection[] = [];

    if (certified) {
      result.push([
        {
          icon: <CertificateIcon color={certificateColor} />,
          content: (
            <span>
              <b style={{ color: certificateColor }}>
                {element.certification_level_name || 'Certified'}
              </b>
              {element.last_certified_by_name ? ` by ${element.last_certified_by_name}` : ''}
              {element.last_certified_time ? ` on ${element.last_certified_time}` : ''}
            </span>
          ),
        },
      ]);
    }

    if (element.element_info) {
      result.push([{ content: <>{element.element_info}</> }]);
    }

    if (element.business_owner || element.business_owner_email) {
      result.push([
        {
          icon: <UserIcon />,
          title: 'Business Owner:',
          content: (
            <a href={`mailto:${element.business_owner_email ?? ''}`}>
              {element.business_owner || element.business_owner_email}
            </a>
          ),
        },
      ]);
    }

    if (element.technical_owner || element.technical_owner_email) {
      result.push([
        {
          icon: <UserIcon />,
          title: 'Technical Owner:',
          content: (
            <a href={`mailto:${element.technical_owner_email ?? ''}`}>
              {element.technical_owner || element.technical_owner_email}
            </a>
          ),
        },
      ]);
    }

    if (element.data_steward || element.data_steward_email) {
      result.push([
        {
          icon: <UserIcon />,
          title: 'Data Steward:',
          content: (
            <a href={`mailto:${element.data_steward_email ?? ''}`}>
              {element.data_steward || element.data_steward_email}
            </a>
          ),
        },
      ]);
    }

    const views = element.global_total_view_count ?? element.total_view_count;

    if (views) {
      result.push([
        {
          icon: <EngagementIcon />,
          title: 'Engagement:',
          content: `${views} views`,
        },
      ]);
    }

    if (!result.length) {
      result.push([{ content: 'No additional information.' }]);
    }

    return result;
  }, [element, certified, certificateColor]);

  /** Keeps the card inside the viewport, measured at its real size. */
  const clampToViewport = useCallback(() => {
    const box = ref.current?.getBoundingClientRect();
    const width = box?.width ?? 300;
    const height = box?.height ?? 200;

    setClamped({
      left: Math.max(MARGIN, Math.min(position.left, window.innerWidth - width - MARGIN)),
      top: Math.max(MARGIN, Math.min(position.top, window.innerHeight - height - MARGIN)),
    });
  }, [position]);

  // Measured after mount so a tall card is clamped by its real height
  useLayoutEffect(() => {
    if (show) {
      clampToViewport();
    }
  }, [show, sections, clampToViewport]);

  // A resize can leave a persistent card hanging off-screen
  useEffect(() => {
    if (!show) {
      return;
    }

    window.addEventListener('resize', clampToViewport);

    return () => window.removeEventListener('resize', clampToViewport);
  }, [show, clampToViewport]);

  // Escape closes, and so does a click anywhere outside the card
  useEffect(() => {
    if (!show) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (ref.current?.contains(target) || triggerRef?.current?.contains(target)) {
        return;
      }

      onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [show, onClose, triggerRef]);

  if (!show) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={clsx(styles.info, certified && styles['info--certified'])}
      style={{
        left: clamped.left,
        top: clamped.top,
        borderColor: certified ? certificateColor : undefined,
      }}
      role="dialog"
      aria-label={`${element.element_dashboard_name} details`}
    >
      <div className={styles.info__header}>
        <span className={styles.info__title}>{element.element_dashboard_name}</span>
        <button type="button" className={styles.info__close} onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <InfoPopup sections={sections} className={styles.info__block} />
    </div>
  );
};

export default ElementInfoPopup;
