import { createContext } from 'react';

export type groupId = {
  currentId: string | null;
  ids: string[] | null;
};

export const GroupContext = createContext<groupId>({
  currentId: null,
  ids: null,
});
