import type { MIElement } from '../types';

/**
 * Which MI iframe view the element viewer embeds. The route also accepts
 * `viewer` (the full element view) and `preview`.
 */
export const VIEWER_IFRAME_TYPE = 'short';

/**
 * Element viewer iframe URL.
 *
 * `other external content` elements are served by the extcontent preview route;
 * everything else uses the iframe service.
 */
export function buildElementViewerUrl(element: MIElement): string {
  const segment = element.segment_value_id ?? 0;

  if (element.element_type === 'other external content') {
    return `/extcontent/index/preview/element/${element.element_id}/segment/${segment}`;
  }

  return `/service/iframe/index/type/${VIEWER_IFRAME_TYPE}/element/${element.element_id}/segment/${segment}`;
}

/**
 * External reports configured to open in their source tool cannot be embedded —
 * they are opened in a new tab instead.
 */
export function opensExternally(element: MIElement): boolean {
  return element.external_report_display === 'external' && !!element.external_report_url?.length;
}
