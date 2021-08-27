import { createContext } from 'react';

export type groupId = {
  currentId: string | null;
  ids: string[] | null;
  setFrontMode: (e: boolean) => void;
};

export const GroupContext = createContext<groupId>({
  currentId: null,
  ids: null,
  setFrontMode: () => {
    return;
  },
});
