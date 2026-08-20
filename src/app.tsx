import { useCallback, useEffect, useMemo, useState } from 'react';

import { useUser } from './api/user';
import { useCatalog } from './hooks/use-catalog';
import { useSelection } from './hooks/use-selection';
import { pluralize } from './helpers/text';
import { countReports, findNode, findNodeForElement, nodePath } from './helpers/tree';
import { opensExternally } from './helpers/elements';
import Hero from './components/hero/hero';
import CatalogSidebar, {
  FAVORITES_NODE_ID,
  SIDEBAR_OVERLAY_BREAKPOINT,
} from './components/catalog-sidebar/catalog-sidebar';
import CatalogOverview from './components/catalog-overview/catalog-overview';
import ElementViewer from './components/element-viewer/element-viewer';
import Loading from './components/loading/loading';
import type { MIElement, TreeNode } from './types';

function App() {
  const { data: user } = useUser();
  const { source, tree, elementsMap, favorites, loading, error } = useCatalog();
  const { selection, selectNode, selectElement, closeElement, showAll } = useSelection();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isOverlay, setIsOverlay] = useState(
    () => window.innerWidth <= SIDEBAR_OVERLAY_BREAKPOINT,
  );

  const isFavoritesNode = selection.nodeId === FAVORITES_NODE_ID;

  /** Favorites behave like a folder so selection, breadcrumbs and counts all work. */
  const favoritesNode = useMemo<TreeNode>(
    () => ({
      id: FAVORITES_NODE_ID,
      name: 'Favorites',
      description: null,
      parent_id: null,
      display_order: 0,
      childs: [],
      elements: favorites,
    }),
    [favorites],
  );

  const node = isFavoritesNode ? favoritesNode : findNode(tree, selection.nodeId);
  const element = selection.elementKey ? elementsMap.get(selection.elementKey) : undefined;

  // A shared link carries the element but no folder, so the breadcrumb falls
  // back to whichever node holds it.
  const breadcrumbNode = node ?? findNodeForElement(tree, selection.elementKey);
  const path = isFavoritesNode
    ? ['Favorites']
    : nodePath(tree, breadcrumbNode?.id ?? null).map((item) => item.name);

  // The sidebar docks on wide viewports and becomes an overlay drawer below the
  // breakpoint, so the hamburger that reopens it only exists in overlay mode.
  useEffect(() => {
    const onResize = () => {
      const overlay = window.innerWidth <= SIDEBAR_OVERLAY_BREAKPOINT;

      setIsOverlay(overlay);

      if (!overlay) {
        setDrawerOpen(false);
      }
    };

    window.addEventListener('resize', onResize);

    return () => window.removeEventListener('resize', onResize);
  }, []);

  /**
   * External reports configured to open in their source tool cannot be embedded,
   * so those open in a new tab instead of the in-page viewer.
   */
  const activateElement = useCallback(
    (target: MIElement, nodeId: number) => {
      if (opensExternally(target)) {
        window.open(target.external_report_url as string, '_blank', 'noopener');

        return;
      }

      selectElement(target, nodeId);
    },
    [selectElement],
  );

  const label = source === 'folders' ? 'folder' : 'category';

  const content = () => {
    if (loading) {
      return <Loading label="Loading content…" />;
    }

    if (error) {
      return (
        <div className="layout__empty">
          <h2>Content could not be loaded</h2>
          <p>{error.message}</p>
          <p>
            Check that you are signed in to Metric Insights and that the{' '}
            <code>{source === 'folders' ? '/api/folder' : '/api/category'}</code> endpoint is
            reachable.
          </p>
        </div>
      );
    }

    if (!tree.length) {
      return (
        <div className="layout__empty">
          <h2>No content available</h2>
          <p>
            No {label} you have access to holds any content. Ask a Metric Insights administrator
            to share content with you, or set the <code>Hide Empty Nodes</code> variable to{' '}
            <code>N</code> to list empty {label === 'folder' ? 'folders' : 'categories'}.
          </p>
        </div>
      );
    }

    if (element) {
      return <ElementViewer element={element} path={path} onClose={closeElement} />;
    }

    // Show All (and the Favorites entry) land on the overview; a selected node
    // points back at the menu, which is the only way into the viewer.
    if (selection.nodeId === null || isFavoritesNode) {
      return (
        <CatalogOverview
          source={source}
          roots={tree}
          favorites={favorites}
          onSelectNode={selectNode}
          onSelectElement={activateElement}
          favoritesNodeId={FAVORITES_NODE_ID}
          variant={isFavoritesNode ? 'favorites' : 'all'}
        />
      );
    }

    if (!node) {
      return (
        <div className="layout__placeholder">
          <h2>Select content</h2>
          <p>Pick a report or dashboard from the menu on the left to open it here.</p>
        </div>
      );
    }

    const childLabel = source === 'folders' ? 'subfolder' : 'subcategory';
    const children = node.childs.length;
    const reports = countReports(node);

    return (
      <div className="layout__placeholder">
        <h2>{node.name}</h2>
        <p>
          {[children ? pluralize(children, childLabel) : null, pluralize(reports, 'report')]
            .filter(Boolean)
            .join(' · ')}{' '}
          — pick one from the menu to open it here.
        </p>
      </div>
    );
  };

  return (
    <div className="layout">
      <CatalogSidebar
        source={source}
        tree={tree}
        favorites={favorites}
        selectedNodeId={selection.nodeId}
        selectedElementKey={selection.elementKey}
        drawerOpen={drawerOpen}
        onDrawerOpenChange={setDrawerOpen}
        onSelectNode={selectNode}
        onSelectElement={activateElement}
        onShowAll={showAll}
      />
      <div className="layout__content">
        <Hero
          user={user}
          onOpenNavigation={isOverlay ? () => setDrawerOpen(true) : undefined}
        />
        {content()}
      </div>
      {/* Anchor for the sidebar and viewer portals */}
      <div id="portal-container-tooltip" style={{ width: 0, height: 0, zIndex: 1002 }} />
    </div>
  );
}

export default App;
