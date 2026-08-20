import useSWR from 'swr';
import { root, swrConfig, USE_FIXTURES } from './base';
import type { MIUserInfo } from '../types';
import userFixture from './fixtures/user.json';

const ENDPOINT = 'index/index/user-info';

async function getUser(): Promise<MIUserInfo | undefined> {
  if (USE_FIXTURES) {
    return userFixture as MIUserInfo;
  }

  return root.get<MIUserInfo>(ENDPOINT).then((response) => {
    const data = response.data;

    // When there is no session MI answers 200 with a { status: 'ERROR',
    // error: 'need_redirect' } envelope instead of the user record.
    if (!data || typeof data.username !== 'string') {
      return undefined;
    }

    return data;
  });
}

export function useUser() {
  return useSWR(ENDPOINT, getUser, swrConfig);
}
