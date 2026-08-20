import type { MICategory, MIElement, MIFolder, MIFolderItem, TreeNode } from '../types';

/** Source-agnostic node before the hierarchy is assembled. */
interface RawNode {
  id: number;
  name: string;
  description: string | null;
  parent_id: number | null;
  display_order: number;
}

export const elementKey = (elementId: number, segmentValueId: number | null | undefined) =>
  `${elementId}_${segmentValueId ?? 0}`;

export function elementsToMap(elements: MIElement[]): Map<string, MIElement> {
  return elements.reduce((acc, element) => {
    acc.set(elementKey(element.element_id, element.segment_value_id), element);

    return acc;
  }, new Map<string, MIElement>());
}

const byOrderThenName = (a: { display_order: number; name: string }, b: { display_order: number; name: string }) =>
  (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name);

const elementsByOrderThenName = (a: MIElement, b: MIElement) =>
  (a.display_order ?? 0) - (b.display_order ?? 0) ||
  a.element_dashboard_name.localeCompare(b.element_dashboard_name);

export function normalizeFolders(folders: MIFolder[]): RawNode[] {
  return folders.map((folder) => ({
    id: Number(folder.folder_id),
    name: folder.name,
    description: folder.description ?? null,
    parent_id: folder.parent_folder_id === null ? null : Number(folder.parent_folder_id),
    display_order: Number(folder.display_order ?? 0),
  }));
}

export function normalizeCategories(categories: MICategory[]): RawNode[] {
  return categories.map((category, index) => ({
    id: Number(category.id),
    name: category.name,
    description: category.description ?? null,
    parent_id: category.parent_category_id === null ? null : Number(category.parent_category_id),
    // /api/category has no display_order — keep the order the API returned
    display_order: index,
  }));
}

/**
 * Groups elements by folder using the folder_items mapping from
 * GET /api/folder_element. Elements the user cannot access are dropped.
 */
export function groupElementsByFolder(
  folderItems: MIFolderItem[],
  elements: MIElement[],
): Map<number, MIElement[]> {
  const elementsMap = elementsToMap(elements);
  const grouped = new Map<number, MIElement[]>();

  for (const item of folderItems) {
    const element = elementsMap.get(elementKey(item.element_id, item.segment_value_id));

    if (!element || element.has_access !== 'Y') {
      continue;
    }

    const folderId = Number(item.folder_id);
    const bucket = grouped.get(folderId);

    if (bucket) {
      bucket.push(element);
    } else {
      grouped.set(folderId, [element]);
    }
  }

  return grouped;
}

/** Groups elements by their category_id (GET /api/element carries it on every row). */
export function groupElementsByCategory(elements: MIElement[]): Map<number, MIElement[]> {
  const grouped = new Map<number, MIElement[]>();

  for (const element of elements) {
    if (element.has_access !== 'Y') {
      continue;
    }

    const categoryId = Number(element.category_id);
    const bucket = grouped.get(categoryId);

    if (bucket) {
      bucket.push(element);
    } else {
      grouped.set(categoryId, [element]);
    }
  }

  return grouped;
}

export interface BuildTreeOptions {
  /** Drop nodes that hold no elements and no non-empty descendants. */
  hideEmpty?: boolean;
}

/**
 * Assembles the folder/category hierarchy. The resulting nodes are structurally
 * compatible with SidebarItem from @metricinsights/pp-components: `childs` renders
 * as collapsible subfolders and `elements` as the leaf list inside a node.
 */
export function buildTree(
  nodes: RawNode[],
  elementsByNodeId: Map<number, MIElement[]>,
  options: BuildTreeOptions = {},
): TreeNode[] {
  const { hideEmpty = true } = options;

  const treeNodes = new Map<number, TreeNode>(
    nodes.map((node) => [
      node.id,
      {
        id: node.id,
        name: node.name,
        description: node.description,
        parent_id: node.parent_id,
        display_order: node.display_order,
        childs: [],
        elements: (elementsByNodeId.get(node.id) ?? []).slice().sort(elementsByOrderThenName),
      },
    ]),
  );

  const roots: TreeNode[] = [];

  for (const node of treeNodes.values()) {
    const parent = node.parent_id === null ? undefined : treeNodes.get(node.parent_id);

    // A node whose parent is missing (no access, deleted) is treated as a root
    if (parent) {
      parent.childs.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortRecursive = (items: TreeNode[]) => {
    items.sort(byOrderThenName);
    items.forEach((item) => sortRecursive(item.childs));
  };

  sortRecursive(roots);

  if (!hideEmpty) {
    return roots;
  }

  const prune = (items: TreeNode[]): TreeNode[] =>
    items
      .map((item) => ({ ...item, childs: prune(item.childs) }))
      .filter((item) => item.elements.length > 0 || item.childs.length > 0);

  return prune(roots);
}

/** Depth-first flattening, used to look a node up by id. */
export function flattenTree(nodes: TreeNode[]): TreeNode[] {
  return nodes.flatMap((node) => [node, ...flattenTree(node.childs)]);
}

export function findNode(nodes: TreeNode[], id: number | null): TreeNode | undefined {
  if (id === null) {
    return undefined;
  }

  return flattenTree(nodes).find((node) => node.id === id);
}

/** Every element in the node and all of its descendants. */
export function countReports(node: TreeNode): number {
  return (
    node.elements.length + node.childs.reduce((total, child) => total + countReports(child), 0)
  );
}

/**
 * The node holding a given element, by `${element_id}_${segment_value_id}` key.
 * Used to rebuild the breadcrumb when an element arrives from a shared link
 * without a folder selection.
 */
export function findNodeForElement(nodes: TreeNode[], key: string | null): TreeNode | undefined {
  if (!key) {
    return undefined;
  }

  return flattenTree(nodes).find((node) =>
    node.elements.some(
      (element) => elementKey(element.element_id, element.segment_value_id) === key,
    ),
  );
}

/** Breadcrumb path from the root down to the given node. */
export function nodePath(nodes: TreeNode[], id: number | null): TreeNode[] {
  if (id === null) {
    return [];
  }

  const walk = (items: TreeNode[], trail: TreeNode[]): TreeNode[] | undefined => {
    for (const item of items) {
      const nextTrail = [...trail, item];

      if (item.id === id) {
        return nextTrail;
      }

      const found = walk(item.childs, nextTrail);

      if (found) {
        return found;
      }
    }

    return undefined;
  };

  return walk(nodes, []) ?? [];
}
