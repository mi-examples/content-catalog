import type { ContentSource } from './types';

export interface PPVariables {
  CONTENT_SOURCE: string;
  WELCOME_MESSAGE: string;
  HERO_SUBTEXT: string;
  HERO_IMAGE: string;
  LOGO: string;
  SIDEBAR_LOGO: string;
  HIDE_EMPTY_NODES: string;
}

declare global {
  interface Window {
    PP_VARIABLES?: Partial<PPVariables>;
  }
}

export const PP_VARIABLES: Partial<PPVariables> =
  typeof window !== 'undefined' && typeof window.PP_VARIABLES === 'object'
    ? (window.PP_VARIABLES as Partial<PPVariables>)
    : {};

/**
 * Reads a Portal Page variable.
 *
 * pp-dev substitutes `[Variable Name]` placeholders with the values configured on
 * the Portal Page. When a variable does not exist (or the app runs outside MI) the
 * literal placeholder survives into window.PP_VARIABLES, so anything that still
 * looks like `[...]` is treated as unset.
 */
export function ppVar(name: keyof PPVariables, fallback = ''): string {
  const raw = PP_VARIABLES[name];

  if (typeof raw !== 'string') {
    return fallback;
  }

  const value = raw.trim();

  if (!value.length || /^\[.*\]$/.test(value)) {
    return fallback;
  }

  return value;
}

const decodeEntities = (value: string) =>
  value
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&');

/**
 * Reads a Portal Page variable that holds an image.
 *
 * MI's image-type variables substitute a full `<img …>` tag rather than a bare
 * URL, which silently breaks both `<img src>` and `background-image: url(…)`.
 * The src is pulled out of the markup when the value carries any.
 */
export function ppVarImage(name: keyof PPVariables, fallback = ''): string {
  const raw = decodeEntities(ppVar(name, fallback));

  if (!raw.length) {
    return '';
  }

  const match = raw.match(/<img[^>]*\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);

  return (match ? (match[1] ?? match[2] ?? match[3] ?? '') : raw).trim();
}

/** Escapes a URL for safe use inside a CSS `url("…")` value. */
export function cssUrl(url: string): string {
  return `url("${url.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`;
}

/** Reads a Y/N or true/false Portal Page variable. */
export function ppVarBool(name: keyof PPVariables, fallback = false): boolean {
  const value = ppVar(name).toLowerCase();

  if (!value.length) {
    return fallback;
  }

  return value === 'y' || value === 'yes' || value === 'true' || value === '1';
}

let sourceWarned = false;

/** Which hierarchy to render. Defaults to folders when the variable is unset. */
export function contentSource(): ContentSource {
  const value = ppVar('CONTENT_SOURCE').toLowerCase();

  if (value === 'folders' || value === 'folder') {
    return 'folders';
  }

  if (value === 'categories' || value === 'category') {
    return 'categories';
  }

  if (!sourceWarned) {
    sourceWarned = true;
    console.warn(
      `[content-catalog] CONTENT_SOURCE is ${
        value.length ? `"${value}"` : 'not set'
      } — falling back to "folders". Expected "folders" or "categories".`,
    );
  }

  return 'folders';
}
