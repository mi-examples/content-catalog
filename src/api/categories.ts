import useSWR from 'swr';
import { api, swrConfig, USE_FIXTURES } from './base';
import type { MICategory, MIElement } from '../types';
import categoriesFixture from './fixtures/category.json';
import elementsFixture from './fixtures/element.json';

interface CategoriesResponse {
  categories: MICategory[];
}

interface ElementsResponse {
  elements: MIElement[];
}

async function getCategories(): Promise<MICategory[]> {
  if (USE_FIXTURES) {
    return (categoriesFixture as CategoriesResponse).categories;
  }

  return api.get<CategoriesResponse>('/category').then((response) => response.data.categories ?? []);
}

async function getElements(): Promise<MIElement[]> {
  if (USE_FIXTURES) {
    return (elementsFixture as ElementsResponse).elements;
  }

  return api.get<ElementsResponse>('/element').then((response) => response.data.elements ?? []);
}

/** GET /api/category — every category the user can see, with parent_category_id. */
export function useCategories(enabled: boolean) {
  return useSWR(enabled ? 'api/category' : null, getCategories, swrConfig);
}

/** GET /api/element — every element the user can see, each carrying category_id. */
export function useElements(enabled: boolean) {
  return useSWR(enabled ? 'api/element' : null, getElements, swrConfig);
}
