/**
 * Shapes returned by the Metric Insights REST API.
 * Field names match the API responses verbatim.
 */

/** Row from GET /api/element or GET /api/folder_element */
export interface MIElement {
  element_id: number;
  segment_value_id: number;
  category_id: number;
  element_dashboard_name: string;
  element_type: string;
  content_type: string;
  display_order: number;
  has_access: 'Y' | 'N';
  certified_ind: 'Y' | 'N';
  certification_level_color: string | null;
  certification_level_name: string | null;
  external_report_display: string | null;
  external_report_url: string | null;
  external_content_type_name: string | null;
  last_measurement_time_formatted?: string;
  // Metadata surfaced by the tile info popup
  element_info: string;
  business_owner?: string;
  business_owner_email?: string;
  technical_owner?: string;
  technical_owner_email?: string;
  data_steward?: string | null;
  data_steward_email?: string | null;
  total_view_count?: number | string | null;
  global_total_view_count?: number | string | null;
  last_certified_by_name?: string | null;
  last_certified_time?: string | null;
  /** Comma-separated list of favorite folder ids the element belongs to. */
  in_favorites?: string | null;
}

/** Row from GET /api/favorite */
export interface MIFavorite {
  id: number;
  name: string;
}

/** Row from GET /api/favorite_element */
export interface MIFavoriteElement {
  element_id: number;
  segment_value_id: number;
  favorite_id: number;
  element_dashboard_name: string;
}

/** Row from GET /api/folder */
export interface MIFolder {
  folder_id: number;
  name: string;
  parent_folder_id: number | null;
  description: string | null;
  display_order: number;
}

/** Row from the folder_items block of GET /api/folder_element */
export interface MIFolderItem {
  folder_id: number;
  element_id: number;
  segment_value_id: number;
  display_order: number;
}

/** Row from GET /api/category (field names are already mapped by the API) */
export interface MICategory {
  id: number;
  name: string;
  parent_category_id: number | null;
  description: string | null;
  visible_on_dashboard: 'Y' | 'N';
}

/** GET /index/index/user-info */
export interface MIUserInfo {
  username: string;
  first_name: string;
  last_name: string;
  display_name: string;
  is_administrator: 'Y' | 'N';
  is_power_user: 'Y' | 'N';
  groups: { group_id: number; name?: string }[];
}

/** Which hierarchy the app renders. Set by the CONTENT_SOURCE Portal Page variable. */
export type ContentSource = 'folders' | 'categories';

/**
 * A node of the rendered hierarchy. Structurally compatible with the
 * SidebarItem type of @metricinsights/pp-components, which renders `childs`
 * as collapsible subfolders and `elements` as the leaf list.
 */
export interface TreeNode {
  id: number;
  name: string;
  description: string | null;
  parent_id: number | null;
  display_order: number;
  childs: TreeNode[];
  elements: MIElement[];
}
