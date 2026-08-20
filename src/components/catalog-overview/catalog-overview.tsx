import { NodeIcon } from '../../helpers/node-icons';
import { pluralize } from '../../helpers/text';
import { countReports, elementKey } from '../../helpers/tree';
import type { ContentSource, MIElement, TreeNode } from '../../types';

import styles from './catalog-overview.module.scss';

type CatalogOverviewProps = {
  source: ContentSource;
  /** Top-level folders/categories. */
  roots: TreeNode[];
  favorites: MIElement[];
  onSelectNode: (nodeId: number) => void;
  onSelectElement: (element: MIElement, nodeId: number) => void;
  /** Node id the favorites list is filed under. */
  favoritesNodeId: number;
  /** 'all' shows the node tiles and the favorites card; 'favorites' only the card. */
  variant?: 'all' | 'favorites';
};

/**
 * The Show All landing view: one tile per top-level folder/category with its
 * child and report counts, plus a card listing the user's favorites.
 */
const CatalogOverview = (props: CatalogOverviewProps) => {
  const {
    source,
    roots,
    favorites,
    onSelectNode,
    onSelectElement,
    favoritesNodeId,
    variant = 'all',
  } = props;

  const childLabel = source === 'folders' ? 'subfolder' : 'subcategory';

  return (
    <div className={styles.overview}>
      {variant === 'all' ? (
      <div className={styles.overview__section}>
        <h2 className={styles.overview__heading}>
          {source === 'folders' ? 'Folders' : 'Categories'}
        </h2>
        <div className={styles.overview__tiles}>
          {roots.map((root) => (
            <button
              key={root.id}
              type="button"
              className={styles.tile}
              onClick={() => onSelectNode(root.id)}
            >
              <span className={styles.tile__icon}>
                <NodeIcon source={source} />
              </span>
              <span className={styles.tile__name}>{root.name}</span>
              <span className={styles.tile__counts}>
                <span>{pluralize(root.childs.length, childLabel)}</span>
                <span className={styles.tile__dot}>·</span>
                <span>{pluralize(countReports(root), 'report')}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
      ) : null}

      <div className={styles.overview__section}>
        <h2 className={styles.overview__heading}>Favorites</h2>
        <div className={styles.favorites}>
          {favorites.length ? (
            <ul className={styles.favorites__list}>
              {favorites.map((element) => (
                <li key={elementKey(element.element_id, element.segment_value_id)}>
                  <button
                    type="button"
                    className={styles.favorites__item}
                    onClick={() => onSelectElement(element, favoritesNodeId)}
                  >
                    <span className={styles.favorites__star} aria-hidden="true">
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="none"
                        aria-hidden="true"
                      >
                        <path d="m12 3.5 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17.4l-5.4 2.9 1.1-6.1L3.2 9.9l6.1-.8Z" />
                      </svg>
                    </span>
                    <span className={styles.favorites__name}>
                      {element.element_dashboard_name}
                    </span>
                    <span className={styles.favorites__type}>
                      {element.content_type || element.element_type}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.favorites__empty}>
              Nothing favorited yet. Open a report and use the star in the viewer header to add
              it here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatalogOverview;
