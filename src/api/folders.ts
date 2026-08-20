import useSWR from 'swr';
import { api, swrConfig, USE_FIXTURES } from './base';
import type { MIElement, MIFolder, MIFolderItem } from '../types';
import foldersFixture from './fixtures/folder.json';
import folderElementsFixture from './fixtures/folder_element.json';

interface FoldersResponse {
  folders: MIFolder[];
}

interface FolderElementsResponse {
  folder_elements: MIElement[];
  folder_items: MIFolderItem[];
}

async function getFolders(): Promise<MIFolder[]> {
  if (USE_FIXTURES) {
    return (foldersFixture as FoldersResponse).folders;
  }

  return api.get<FoldersResponse>('/folder').then((response) => response.data.folders ?? []);
}

async function getFolderElements(): Promise<FolderElementsResponse> {
  if (USE_FIXTURES) {
    return folderElementsFixture as FolderElementsResponse;
  }

  return api.get<FolderElementsResponse>('/folder_element').then((response) => ({
    folder_elements: response.data.folder_elements ?? [],
    folder_items: response.data.folder_items ?? [],
  }));
}

/** GET /api/folder — every folder the user can see, with parent_folder_id. */
export function useFolders(enabled: boolean) {
  return useSWR(enabled ? 'api/folder' : null, getFolders, swrConfig);
}

/** GET /api/folder_element — elements plus the folder -> element mapping. */
export function useFolderElements(enabled: boolean) {
  return useSWR(enabled ? 'api/folder_element' : null, getFolderElements, swrConfig);
}
