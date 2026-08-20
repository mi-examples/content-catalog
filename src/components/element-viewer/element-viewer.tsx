import { useMemo } from 'react';

import { USE_FIXTURES } from '../../api/base';
import { buildElementViewerUrl } from '../../helpers/elements';
import { elementKey } from '../../helpers/tree';
import ViewerControls from './viewer-controls';
import type { MIElement } from '../../types';

import styles from './element-viewer.module.scss';

type ElementViewerProps = {
  element: MIElement;
  /** Folder/category names from the root down to the element's node. */
  path: string[];
  onClose: () => void;
};

const ElementViewer = (props: ElementViewerProps) => {
  const { element, path, onClose } = props;

  const src = useMemo(() => buildElementViewerUrl(element), [element]);
  const crumbs = [...path, element.element_dashboard_name];

  return (
    <section className={styles.viewer}>
      <div className={styles.viewer__header}>
        <div className={styles.viewer__breadcrumbs}>
          {crumbs.map((crumb, index) => (
            <span key={`${crumb}-${index}`} className={styles.viewer__crumb}>
              {index > 0 ? <span className={styles.viewer__divider}>/</span> : null}
              <span className={index === crumbs.length - 1 ? styles.viewer__current : undefined}>
                {crumb}
              </span>
            </span>
          ))}
        </div>
        <div className={styles.viewer__controls}>
          <ViewerControls element={element} />
          <a
            className={styles.viewer__button}
            href={src}
            target="_blank"
            rel="noreferrer"
            title="Open in a new tab"
          >
            Open in new tab
          </a>
          <button
            type="button"
            className={styles.viewer__button}
            onClick={onClose}
            title="Close the viewer"
          >
            Close
          </button>
        </div>
      </div>
      {USE_FIXTURES ? (
        // The MI viewer route only exists on the instance, so fixtures mode shows
        // the URL that would be embedded instead of a dead iframe.
        <div className={styles.viewer__fixtures}>
          <p>Fixtures mode — the element viewer is served by Metric Insights.</p>
          <code>{src}</code>
        </div>
      ) : (
        <iframe
          // Re-mount on element change so the viewer reloads instead of navigating
          key={elementKey(element.element_id, element.segment_value_id)}
          className={styles.viewer__frame}
          title={element.element_dashboard_name}
          name="frame"
          src={src}
        />
      )}
    </section>
  );
};

export default ElementViewer;
