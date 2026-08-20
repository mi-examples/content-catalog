import { useCallback, useEffect, useState } from 'react';
import { elementKey } from '../helpers/tree';
import type { MIElement } from '../types';

export interface Selection {
  nodeId: number | null;
  elementKey: string | null;
}

/**
 * Only the open element is read back from the URL — that is what the share
 * button hands out. The selected folder is in-session navigation state, so it
 * is not restored and the app always opens on Show All.
 */
const readSelection = (): Selection => {
  const element = new URLSearchParams(window.location.search).get('element');

  return {
    nodeId: null,
    elementKey: element && /^\d+_\d+$/.test(element) ? element : null,
  };
};

/**
 * Selected node + element. The element is mirrored into the query string so a
 * view can be shared or reloaded; replaceState is used instead of a router
 * because the app is a single pane served from a /pl/<name> base path.
 */
export function useSelection() {
  const [selection, setSelection] = useState<Selection>(readSelection);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    params.delete('node');

    if (selection.elementKey === null) {
      params.delete('element');
    } else {
      params.set('element', selection.elementKey);
    }

    const query = params.toString();

    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${query.length ? `?${query}` : ''}`,
    );
  }, [selection]);

  const selectNode = useCallback((nodeId: number) => {
    setSelection((prev) => (prev.nodeId === nodeId ? prev : { nodeId, elementKey: null }));
  }, []);

  const selectElement = useCallback((element: MIElement, nodeId?: number | null) => {
    setSelection((prev) => ({
      nodeId: nodeId ?? prev.nodeId,
      elementKey: elementKey(element.element_id, element.segment_value_id),
    }));
  }, []);

  const closeElement = useCallback(() => {
    setSelection((prev) => (prev.elementKey === null ? prev : { ...prev, elementKey: null }));
  }, []);

  /** Back to the overview: no node and no element selected. */
  const showAll = useCallback(() => {
    setSelection((prev) =>
      prev.nodeId === null && prev.elementKey === null
        ? prev
        : { nodeId: null, elementKey: null },
    );
  }, []);

  return { selection, selectNode, selectElement, closeElement, showAll };
}
