import { useMemo } from 'react';
import { contentSource, ppVarBool } from '../constants';
import { useFolders, useFolderElements } from '../api/folders';
import { useCategories, useElements } from '../api/categories';
import { useFavoriteElements, useFavoriteFolder } from '../api/favorites';
import {
  buildTree,
  elementKey,
  elementsToMap,
  groupElementsByCategory,
  groupElementsByFolder,
  normalizeCategories,
  normalizeFolders,
} from '../helpers/tree';
import type { ContentSource, MIElement, TreeNode } from '../types';

export interface Catalog {
  source: ContentSource;
  tree: TreeNode[];
  /** Every accessible element, keyed by `${element_id}_${segment_value_id}`. */
  elementsMap: Map<string, MIElement>;
  /** The user's favorited elements, resolved against the catalog. */
  favorites: MIElement[];
  loading: boolean;
  error?: Error;
}

/**
 * Loads the hierarchy from whichever source the CONTENT_SOURCE Portal Page
 * variable selects, and assembles it into a single tree shape. Only the endpoints
 * for the active source are requested — the other pair is gated off with a null
 * SWR key.
 */
export function useCatalog(): Catalog {
  const source = contentSource();
  const isFolders = source === 'folders';
  const hideEmpty = ppVarBool('HIDE_EMPTY_NODES', true);

  const folders = useFolders(isFolders);
  const folderElements = useFolderElements(isFolders);
  const categories = useCategories(!isFolders);
  const elements = useElements(!isFolders);

  const allElements: MIElement[] = useMemo(() => {
    if (isFolders) {
      return folderElements.data?.folder_elements ?? [];
    }

    return elements.data ?? [];
  }, [isFolders, folderElements.data, elements.data]);

  const tree = useMemo(() => {
    if (isFolders) {
      if (!folders.data || !folderElements.data) {
        return [];
      }

      return buildTree(
        normalizeFolders(folders.data),
        groupElementsByFolder(folderElements.data.folder_items, folderElements.data.folder_elements),
        { hideEmpty },
      );
    }

    if (!categories.data || !elements.data) {
      return [];
    }

    return buildTree(normalizeCategories(categories.data), groupElementsByCategory(elements.data), {
      hideEmpty,
    });
  }, [isFolders, hideEmpty, folders.data, folderElements.data, categories.data, elements.data]);

  const elementsMap = useMemo(
    () => elementsToMap(allElements.filter((element) => element.has_access === 'Y')),
    [allElements],
  );

  const { data: favoriteFolder } = useFavoriteFolder();
  const { data: favoriteElements } = useFavoriteElements(favoriteFolder?.id);

  // Favorites come back as ids only, so they are resolved against the catalog
  // and quietly dropped when the user can no longer see the element.
  const favorites = useMemo(() => {
    if (!favoriteElements?.length || !elementsMap.size) {
      return [];
    }

    return favoriteElements
      .map((favorite) =>
        elementsMap.get(elementKey(Number(favorite.element_id), Number(favorite.segment_value_id))),
      )
      .filter((element): element is MIElement => !!element)
      .sort((a, b) => a.element_dashboard_name.localeCompare(b.element_dashboard_name));
  }, [favoriteElements, elementsMap]);

  const loading = isFolders
    ? folders.isLoading || folderElements.isLoading
    : categories.isLoading || elements.isLoading;

  const error = isFolders
    ? (folders.error as Error | undefined) ?? (folderElements.error as Error | undefined)
    : (categories.error as Error | undefined) ?? (elements.error as Error | undefined);

  return { source, tree, elementsMap, favorites, loading, error };
}
