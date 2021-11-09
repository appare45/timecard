import {
  addDoc,
  collection,
  doc,
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  FieldPath,
  getDoc,
  getDocs,
  limit,
  orderBy,
  OrderByDirection,
  query,
  Query,
  QueryConstraint,
  QueryDocumentSnapshot,
  QuerySnapshot,
  setDoc,
  SetOptions,
  SnapshotOptions,
  startAfter,
  where,
} from 'firebase/firestore';
import { Db } from './firebase';
import { tag } from './group-tag';

export type memberStatus = 'active' | 'inactive';

export class Member {
  name = '';
  photoUrl = '';
  status: memberStatus | null = null;

  tag: DocumentReference<tag>[] = [];
  constructor(
    name: string,
    photoUrl: string | null = null,
    status: memberStatus,
    tag: DocumentReference<tag>[]
  ) {
    this.name = name;
    if (photoUrl) this.photoUrl = photoUrl;
    this.status = status;
    this.tag = tag;
  }
}

const memberDataConverter = {
  toFirestore(member: Member): DocumentData {
    return {
      name: member.name,
      photoUrl: member.photoUrl ?? '',
      tag: member.tag ?? [],
      status: member.status ?? false,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    option?: SnapshotOptions
  ): Member {
    const data = snapshot.data(option);
    return new Member(
      data.name,
      data.photoUrl,
      data.status ?? null,
      data.tag ?? []
    );
  },
};

/**
 * メンバーを追加する
 * @param member メンバーのデータ
 * @param groupId 追加するグループ名
 * @returns メンバーのID
 */
export async function addMember(
  member: Member,
  groupId: string
): Promise<string> {
  try {
    const group = await addDoc<Member>(
      collection(Db(), `group/${groupId}/member/`).withConverter(
        memberDataConverter
      ),
      member
    );
    return group.id;
  } catch (error) {
    console.error(error);
    throw new Error();
  }
}

export async function updateMember(
  member: Partial<Member>,
  memberId: string,
  groupId: string
): Promise<void> {
  try {
    return await setDoc<Member>(
      doc(Db(), `group/${groupId}/member/${memberId}`).withConverter(
        memberDataConverter
      ),
      member,
      { merge: true }
    );
  } catch (error) {
    console.error(error);
    throw new Error();
  }
}
export async function setMember(
  member: Member,
  memberId: string,
  groupId: string,
  option?: SetOptions
): Promise<void> {
  try {
    return await setDoc<Member>(
      doc(Db(), `group/${groupId}/member/${memberId}`).withConverter(
        memberDataConverter
      ),
      member,
      option ?? {}
    );
  } catch (error) {
    console.error(error);
    throw new Error();
  }
}

export async function getMember(
  memberId: string,
  groupId: string
): Promise<DocumentSnapshot<Member> | null> {
  try {
    const member = getDoc(
      doc(Db(), `group/${groupId}/member/${memberId}`).withConverter(
        memberDataConverter
      )
    );

    return await member;
  } catch (error) {
    return null;
  }
}

export const setMemberStatus = async (
  status: memberStatus,
  memberId: string,
  groupId: string
): Promise<void> => {
  try {
    await setDoc(
      doc(Db(), `group/${groupId}/member/${memberId}`),
      {
        status: status,
      },
      { merge: true }
    );
    return;
  } catch (error) {
    throw new Error();
  }
};

export const listMembers = async (
  id: string,
  limitNumber?: number,
  order?: [fieldPath: string | FieldPath, directionStr?: OrderByDirection],
  status?: memberStatus,
  lastDoc?: QueryDocumentSnapshot,
  tag?: DocumentReference<tag>
): Promise<Readonly<QuerySnapshot<Member> | null> | null> => {
  try {
    if (limitNumber || order || tag || status) {
      const qcs: QueryConstraint[] = [];
      if (limitNumber) qcs.push(limit(limitNumber));
      if (order) qcs.push(orderBy(...order));
      if (status) qcs.push(where('status', '==', status));
      if (lastDoc) qcs.push(startAfter(lastDoc));
      if (tag) qcs.push(where('tag', 'array-contains', tag));
      const q: Query<Member> = query(
        collection(Db(), `group/${id}/member`).withConverter(
          memberDataConverter
        ),
        ...qcs
      );
      return await getDocs(q);
    } else {
      return await getDocs(
        collection(Db(), `group/${id}/member`).withConverter(
          memberDataConverter
        )
      );
    }
  } catch (error) {
    console.error(error);
    throw new Error();
  }
};

export const setMemberTag = async (
  tags: DocumentReference<tag>[],
  memberId: string,
  groupId: string
): Promise<void> => {
  try {
    await setDoc(
      doc(Db(), `group/${groupId}/member/${memberId}`),
      {
        tag: tags,
      },
      { merge: true }
    );
  } catch (error) {
    console.error(error);
    throw new Error();
  }
};
