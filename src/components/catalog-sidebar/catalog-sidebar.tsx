import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Sidebar,
  SidebarNavItem,
  type SidebarElement,
  type SidebarItem,
} from '@metricinsights/pp-components';
import clsx from 'clsx';

import { ppVarImage } from '../../constants';
import { buildElementViewerUrl, opensExternally } from '../../helpers/elements';
import { elementKey } from '../../helpers/tree';
import { LOGOS } from '../../helpers/logos';
import { NodeIcon } from '../../helpers/node-icons';
import type { ContentSource, MIElement, TreeNode } from '../../types';

import styles from './catalog-sidebar.module.scss';

/** Below this width the sidebar becomes an overlay drawer instead of a docked column. */
export const SIDEBAR_OVERLAY_BREAKPOINT = 1106;

/** Pseudo-node id for the favorites list, kept clear of real folder ids. */
export const FAVORITES_NODE_ID = -1;

type CatalogSidebarProps = {
  source: ContentSource;
  tree: TreeNode[];
  favorites: MIElement[];
  selectedNodeId: number | null;
  selectedElementKey: string | null;
  /** Overlay drawer is open (only meaningful below the breakpoint). */
  drawerOpen: boolean;
  onDrawerOpenChange: (open: boolean) => void;
  onSelectNode: (nodeId: number) => void;
  onSelectElement: (element: MIElement, nodeId: number) => void;
  onShowAll: () => void;
};

interface CatalogSidebarElement extends SidebarElement {
  element: MIElement;
  nodeId: number;
}

type Position = { left: number; top: number };

const SHOW_ALL_ID = 'show-all';
const FAVORITES_ITEM_ID = 'favorites';

const toSidebarElements = (elements: MIElement[], nodeId: number): CatalogSidebarElement[] =>
  elements.map((element) => ({
    id: `el_${elementKey(element.element_id, element.segment_value_id)}`,
    name: element.element_dashboard_name,
    element,
    nodeId,
  }));

/**
 * Maps the catalog tree onto the shape pp-components' Sidebar renders:
 * `childs` become collapsible subfolders, `elements` become the leaf list.
 * Element ids are namespaced so they never collide with node ids.
 */
const toSidebarItems = (nodes: TreeNode[], icon: SidebarItem['icon']): SidebarItem[] =>
  nodes.map((node) => ({
    id: node.id,
    name: node.name,
    parent_id: node.parent_id,
    icon,
    childs: toSidebarItems(node.childs, icon),
    elements: toSidebarElements(node.elements, node.id),
  }));

const CatalogSidebar = (props: CatalogSidebarProps) => {
  const {
    source,
    tree,
    favorites,
    selectedNodeId,
    selectedElementKey,
    drawerOpen,
    onDrawerOpenChange,
    onSelectNode,
    onSelectElement,
    onShowAll,
  } = props;

  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [expanded, setExpanded] = useState(true);
  const [tooltip, setTooltip] = useState<{ text: string; position: Position } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    element: MIElement;
    position: Position;
  } | null>(null);

  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const isOverlay = viewportWidth <= SIDEBAR_OVERLAY_BREAKPOINT;
  /** Icon-only rail: the collapsed desktop state. */
  const isRail = !isOverlay && !expanded;

  // SIDEBAR_LOGO wins when set, so the sidebar can carry a compact mark while
  // the hero keeps the full lockup. Unset, the brand lockup is used — swapped
  // for the square mark in the rail, where a wordmark has no room.
  const logo =
    ppVarImage('SIDEBAR_LOGO') ||
    ppVarImage('LOGO') ||
    (isRail ? LOGOS.purpleMark : LOGOS.purpleFull);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);

    window.addEventListener('resize', onResize);

    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Dismiss the context menu on any click outside it
  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    const onDocumentClick = (event: MouseEvent) => {
      if (!contextMenuRef.current?.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    document.addEventListener('click', onDocumentClick);

    return () => document.removeEventListener('click', onDocumentClick);
  }, [contextMenu]);

  const portalContainer = document.getElementById('portal-container-tooltip');

  const nodeIcon = useMemo(
    () => (<NodeIcon source={source} />) as unknown as SidebarItem['icon'],
    [source],
  );

  const sidebarItems = useMemo(() => toSidebarItems(tree, nodeIcon), [tree, nodeIcon]);

  /**
   * A node selected from outside the sidebar — a Show All tile — has to open
   * here too. pp-components only exposes its folder-open state through
   * `initialActiveItem`, and a bare `{ id }` opens exactly that node (passing
   * the real item would open its whole subtree).
   */
  const externalActiveItem = useMemo(
    () =>
      selectedNodeId !== null && selectedNodeId !== FAVORITES_NODE_ID
        ? { sidebarItem: { id: selectedNodeId, name: '' } }
        : undefined,
    [selectedNodeId],
  );

  // Selecting a real node while the sidebar is a rail opens the sidebar, so the
  // node's contents are actually visible.
  useEffect(() => {
    if (selectedNodeId !== null && selectedNodeId !== FAVORITES_NODE_ID) {
      setExpanded(true);
    }
  }, [selectedNodeId]);

  const favoritesItem = useMemo<SidebarItem>(
    () => ({
      id: FAVORITES_ITEM_ID,
      name: 'Favorites',
      elements: toSidebarElements(favorites, FAVORITES_NODE_ID),
    }),
    [favorites],
  );

  const showTooltip = useCallback(
    (text: string, event: React.MouseEvent) => {
      if (!isRail) {
        return;
      }

      const { right, top, height } = event.currentTarget.getBoundingClientRect();

      setTooltip({ text, position: { left: right + 12, top: top + height / 2 } });
    },
    [isRail],
  );

  const hideTooltip = useCallback(() => setTooltip(null), []);

  /**
   * Picking anything from the collapsed rail opens the sidebar, so the folder
   * that was just selected reveals its contents instead of staying hidden.
   */
  const expandFromRail = useCallback(() => {
    setExpanded(true);
    setTooltip(null);
  }, []);

  /** Selecting anything closes the overlay drawer, matching the mobile drawer flow. */
  const closeOverlay = useCallback(() => {
    if (isOverlay) {
      onDrawerOpenChange(false);
    }
  }, [isOverlay, onDrawerOpenChange]);

  const handleItemClick = (item: SidebarItem) => {
    expandFromRail();
    onSelectNode(Number(item.id));
    closeOverlay();
  };

  const handleElementClick = (item: SidebarElement) => {
    const { element, nodeId } = item as CatalogSidebarElement;

    hideTooltip();
    onSelectElement(element, nodeId);
    closeOverlay();
  };

  const handleHeaderToggle = () => {
    if (isOverlay) {
      onDrawerOpenChange(false);

      return;
    }

    hideTooltip();
    setExpanded((prev) => !prev);
  };

  // pp-components renders nothing useful before the tree exists, and mounting it
  // empty would also lose the initial active state.
  if (!sidebarItems.length) {
    return null;
  }

  const openInNewTab = (element: MIElement) => {
    const url = opensExternally(element)
      ? (element.external_report_url as string)
      : buildElementViewerUrl(element);

    window.open(url, '_blank', 'noopener');
    setContextMenu(null);
  };

  const renderElement = (name: string, item: SidebarElement) => {
    const { element } = item as CatalogSidebarElement;
    const key = elementKey(element.element_id, element.segment_value_id);

    return (
      <span
        className={clsx(styles.sidebar__element, key === selectedElementKey && styles['is-active'])}
        onContextMenu={(event) => {
          event.preventDefault();
          setContextMenu({
            element,
            position: { left: event.clientX, top: event.clientY },
          });
        }}
      >
        {name}
      </span>
    );
  };

  const renderName = (name: string, active: boolean) => (
    <span className={clsx(styles.sidebar__itemName, active && styles['is-active'])}>{name}</span>
  );

  return (
    <>
      <Sidebar
        className={clsx(
          styles.sidebar,
          isRail && styles['sidebar--rail'],
          isOverlay && styles['sidebar--overlay'],
          isOverlay && !drawerOpen && styles['sidebar--hidden'],
        )}
        sidebarOpen={expanded}
        initialActiveItem={externalActiveItem}
        showSubfolderIcon
        subfolderIcon={nodeIcon as unknown as React.ReactNode}
        sidebarItems={sidebarItems}
        sidebarItemClick={handleItemClick}
        sidebarSubfolderItemClick={handleItemClick}
        sidebarListItemClick={handleElementClick}
        sidebarItemMouseEnter={(item, event) => showTooltip(item.name, event)}
        sidebarItemClassName={styles.sidebar__item}
        headerComponent={
          <div className={styles.sidebar__header}>
            <button
              type="button"
              className={styles.sidebar__toggle}
              onClick={handleHeaderToggle}
              aria-label={isOverlay ? 'Close the navigation' : 'Collapse the navigation'}
              title={isOverlay ? 'Close' : expanded ? 'Collapse' : 'Expand'}
            >
              {isOverlay ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
            <button
              type="button"
              className={styles.sidebar__logo}
              onClick={() => {
                onShowAll();
                closeOverlay();
              }}
              title="Show all content"
            >
              {logo.length ? (
                <img src={logo} alt="Logo" />
              ) : (
                <span className={styles.sidebar__wordmark}>Catalog</span>
              )}
            </button>
          </div>
        }
        sidebarItemRender={(item) => renderName(item.name, Number(item.id) === selectedNodeId)}
        sidebarListItemRender={renderElement}
      >
        <div className={styles.sidebar__navTitle}>Content</div>

        <div
          onMouseEnter={(event) => showTooltip('Show All', event)}
          onMouseLeave={hideTooltip}
        >
          <SidebarNavItem
            className={styles.sidebar__item}
            onClick={() => {
              expandFromRail();
              onShowAll();
              closeOverlay();
            }}
            item={{ id: SHOW_ALL_ID, name: 'Show All' }}
            icon={
              <svg
                className={styles.sidebar__staticIcon}
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" />
                <rect x="13.5" y="3.5" width="7" height="7" rx="1.4" />
                <rect x="3.5" y="13.5" width="7" height="7" rx="1.4" />
                <rect x="13.5" y="13.5" width="7" height="7" rx="1.4" />
              </svg>
            }
            render={(item) =>
              renderName(item.name, selectedNodeId === null && selectedElementKey === null)
            }
          />
        </div>

        <div
          onMouseEnter={(event) => showTooltip('Favorites', event)}
          onMouseLeave={hideTooltip}
        >
          <SidebarNavItem
            className={styles.sidebar__item}
            onClick={() => {
              expandFromRail();
              onSelectNode(FAVORITES_NODE_ID);
              closeOverlay();
            }}
            item={favoritesItem}
            icon={
              <svg
                className={styles.sidebar__staticIcon}
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 3.5 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17.4l-5.4 2.9 1.1-6.1L3.2 9.9l6.1-.8Z" />
              </svg>
            }
            render={(item) => renderName(item.name, selectedNodeId === FAVORITES_NODE_ID)}
            listItemRender={renderElement}
            onListItemClick={(_, item) => handleElementClick(item)}
          />
        </div>
      </Sidebar>

      {isOverlay && drawerOpen
        ? createPortal(
            <div
              className={styles.sidebar__scrim}
              onClick={() => onDrawerOpenChange(false)}
            />,
            document.body,
          )
        : null}

      {portalContainer && tooltip && isRail
        ? createPortal(
            <div
              className={styles.sidebar__tooltip}
              style={{ left: tooltip.position.left, top: tooltip.position.top }}
            >
              {tooltip.text}
            </div>,
            portalContainer,
          )
        : null}

      {portalContainer && contextMenu
        ? createPortal(
            <div
              ref={contextMenuRef}
              className={styles.sidebar__contextMenu}
              style={{ left: contextMenu.position.left, top: contextMenu.position.top }}
            >
              <button
                type="button"
                className={styles.sidebar__contextMenuItem}
                onClick={() => openInNewTab(contextMenu.element)}
              >
                Open in new tab
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>,
            portalContainer,
          )
        : null}
    </>
  );
};

export default CatalogSidebar;
