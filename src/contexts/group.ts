import { DocumentSnapshot } from 'firebase/firestore';
import { createContext } from 'react';
import { Member } from '../utils/group';

export type groupId = {
  currentId: string | null;
  ids: string[] | null;
  isAdmin: boolean;
  setFrontMode: (e: boolean) => void | null;
  currentMember: DocumentSnapshot<Member> | null;
  updateCurrentMember: (e: DocumentSnapshot<Member>) => void;
};

export const GroupContext = createContext<Partial<groupId>>({});
