import { doc, setDoc } from '@firebase/firestore';
import { Db } from './firebase';

export type Invite = {
  authorId: string;
  groupId: string;
};

export const createInvite = async (
  email: string,
  groupId: string,
  code: string
): Promise<void> => {
  try {
    return setDoc(doc(Db(), `invite/${code}`), {
      email: email,
      groupId: groupId,
    });
  } catch (error) {
    console.error(error);
    throw new Error();
  }
};
