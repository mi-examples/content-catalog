import useSWR, { mutate } from 'swr';
import useSWRImmutable from 'swr/immutable';
import { api, swrConfig, USE_FIXTURES } from './base';
import type { MIFavorite, MIFavoriteElement } from '../types';
import favoritesFixture from './fixtures/favorite.json';
import favoriteElementsFixture from './fixtures/favorite_element.json';

/** MI creates this folder for every user; tiles toggle membership in it. */
export const DEFAULT_FAVORITE_FOLDER = 'My Favorites';

const favoriteElementsKey = (favoriteId?: number) =>
  favoriteId ? `api/favorite_element?favorite_id=${favoriteId}` : null;

async function getFavoriteFolder(): Promise<MIFavorite | undefined> {
  const favorites = USE_FIXTURES
    ? (favoritesFixture as { favorites: MIFavorite[] }).favorites
    : await api
        .get<{ favorites: MIFavorite[] }>('/favorite')
        .then((response) => response.data.favorites ?? []);

  return favorites.find((favorite) => favorite.name === DEFAULT_FAVORITE_FOLDER) ?? favorites[0];
}

/**
 * Fixtures mode has no backend to write to, so toggles are held in memory for
 * the session — otherwise every star would snap back on revalidation.
 */
const fixtureFavorites = new Set(
  (favoriteElementsFixture as { favorite_elements: MIFavoriteElement[] }).favorite_elements.map(
    (favorite) => `${favorite.element_id}_${favorite.segment_value_id ?? 0}`,
  ),
);

async function getFavoriteElements(favoriteId: number): Promise<MIFavoriteElement[]> {
  if (USE_FIXTURES) {
    return Array.from(fixtureFavorites).map((key) => {
      const [elementId, segmentValueId] = key.split('_');

      return {
        element_id: Number(elementId),
        segment_value_id: Number(segmentValueId),
        favorite_id: favoriteId,
        element_dashboard_name: '',
      };
    });
  }

  return api
    .get<{ favorite_elements: MIFavoriteElement[] }>(
      `/favorite_element?favorite_id=${favoriteId}`,
    )
    .then((response) => response.data.favorite_elements ?? []);
}

/** GET /api/favorite — the user's default favorites folder. */
export function useFavoriteFolder() {
  return useSWRImmutable('api/favorite', getFavoriteFolder, swrConfig);
}

/** GET /api/favorite_element — everything in that folder. */
export function useFavoriteElements(favoriteId?: number) {
  return useSWR(
    favoriteElementsKey(favoriteId),
    () => getFavoriteElements(favoriteId as number),
    swrConfig,
  );
}

export async function addElementToFavorite(
  favoriteId: number,
  elementId: number,
  segmentValueId: number,
) {
  if (USE_FIXTURES) {
    fixtureFavorites.add(`${elementId}_${segmentValueId}`);
  } else {
    await api.post('/favorite_element', {
      favorite_id: favoriteId,
      element_id: elementId,
      segment_value_id: segmentValueId,
    });
  }

  await mutate(favoriteElementsKey(favoriteId));
}

export async function deleteFavoriteElement(
  favoriteId: number,
  elementId: number,
  segmentValueId: number,
) {
  if (USE_FIXTURES) {
    fixtureFavorites.delete(`${elementId}_${segmentValueId}`);
  } else {
    const params = new URLSearchParams({
      favorite_id: String(favoriteId),
      id: String(elementId),
      segment_value_id: String(segmentValueId),
    });

    await api.delete(`/favorite_element?${params.toString()}`);
  }

  await mutate(favoriteElementsKey(favoriteId));
}
