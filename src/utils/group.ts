import {
  Timestamp,
  QueryDocumentSnapshot,
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  setDoc,
  FirestoreDataConverter,
  SnapshotOptions,
  WithFieldValue,
  serverTimestamp,
  FieldValue,
  getDoc,
  doc,
  DocumentSnapshot,
  QuerySnapshot,
  orderBy,
  limit,
  FieldPath,
  DocumentData,
  SetOptions,
  startAfter,
  DocumentReference,
} from 'firebase/firestore';
import { app } from './../utils/firebase';
import { addMember, Member, setMemberStatus } from './member';
const Db = getFirestore(app);

class Admin {
  constructor(readonly upGraded: FieldValue, readonly upGradedBy: string) {}
}

//** 管理はメンバーベースで行う */
export class Account {
  constructor(readonly memberId: string, readonly isActive: boolean) {}
}

export class Group {
  name: string;
  joinStatus: boolean;
  created: FieldPath;
  authorId: string;
  constructor(
    name: string,
    joinStatus: boolean,
    created: FieldValue,
    authorId: string
  ) {
    this.name = name;
    this.joinStatus = joinStatus;
    this.created = created;
    this.authorId = authorId;
  }
}

type activityType = 'work';

export type activity<T> = {
  type: activityType;
  memberId: string;
  content: T;
  updated?: Timestamp;
};

export type workStatus = 'running' | 'done';

export type work = {
  startTime: Timestamp;
  endTime: Timestamp | null;
  memo: string;
  status: workStatus;
};
export const statusToText = (status: workStatus): string => {
  switch (status) {
    case 'running':
      return '進行中';

    case 'done':
      return '完了';

    default:
      return '不明';
  }
};

/**
 * account, memberの検証が必要な場合にはisAccount, isMemberの使用を推奨する
 * @param item 検証が必要なオブジェクト
 * @returns 検証結果
 */
const isGroup = (item: {
  name?: unknown;
  joinStatus?: unknown;
  created?: unknown;
  authorId?: unknown;
}): item is Group => {
  if (!(item.name && typeof item.name == 'string' && item.name.length > 0)) {
    return false;
  }
  if (!(item.joinStatus && typeof item.joinStatus == 'boolean')) {
    return false;
  }
  if (!(item?.authorId && typeof item.authorId === 'string')) {
    return false;
  }
  if (!item?.created) {
    return false;
  }

  return true;
};

const groupDataConverter: FirestoreDataConverter<Group> = {
  toFirestore(group: Group): DocumentData {
    return group;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    option: SnapshotOptions
  ): Group {
    const data = snapshot.data(option);
    if (isGroup(data)) {
      throw new Error('データ取得時にエラーが発生しました');
    }
    return {
      name: data.name,
      joinStatus: data.joinStatus,
      authorId: data.authorId,
      created: data.created,
    };
  },
};

const accountDataConverter: FirestoreDataConverter<Account> = {
  toFirestore(account: WithFieldValue<Account>): DocumentData {
    return {
      memberId: account.memberId,
      isActive: account.isActive,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    option?: SnapshotOptions
  ): Account {
    const data = snapshot.data(option);
    return new Account(data.memberId, data?.isActive ?? true);
  },
};

const adminDataConverter = {
  toFirestore(admin: Admin): DocumentData {
    return {
      upgraded: admin.upGraded ?? null,
      upgradedBy: admin.upGradedBy ?? null,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    option?: SnapshotOptions
  ): Admin {
    const data = snapshot.data(option);
    return new Admin(data.upGraded, data.upGradedBy);
  },
};

const activityDataConverter = {
  toFirestore(activity: activity<work>): DocumentData {
    const data = activity;
    data.updated = Timestamp.now();
    return activity;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    option?: SnapshotOptions
  ): activity<work> {
    const data = snapshot.data(option);
    return {
      updated: data?.updated ?? null,
      content: {
        memo: data.content?.memo ?? '',
        startTime: data.content?.startTime,
        endTime: data.content?.endTime,
        status: data.content?.status,
      },
      memberId: data?.memberId,
      type: data?.type,
    };
  },
};

const createGroup = (
  group: { name: string; joinStatus: boolean },
  author: Member,
  authorId: string
): Promise<DocumentReference<Group>> => {
  try {
    const _group: Readonly<Group> = {
      name: group.name,
      joinStatus: group.joinStatus,
      authorId: authorId,
      created: serverTimestamp(),
    };
    return addDoc(
      collection(Db, 'group').withConverter(groupDataConverter),
      _group
    ).then((group_1) => {
      addMember(
        {
          name: author.name,
          photoUrl: author.photoUrl,
          status: 'inactive',
          tag: author.tag ?? [],
        },
        group_1.id
      ).then((memberId) => {
        addAccount(
          authorId,
          { memberId: memberId, isActive: true },
          group_1.id
        );
        addAdmin(memberId, memberId, group_1.id);
      });
      return group_1;
    });
  } catch (error) {
    console.error(error);
    throw new Error();
  }
};

async function addAccount(
  accountId: string,
  account: Account,
  groupId: string
): Promise<void> {
  try {
    await setDoc(
      doc(Db, `group/${groupId}/account/`, accountId).withConverter<Account>(
        accountDataConverter
      ),
      account
    );
    return;
  } catch (e) {
    console.error(e);
    throw new Error();
  }
}

async function getAccount(
  email: string,
  groupId: string
): Promise<DocumentSnapshot<Account>> {
  try {
    return await getDoc<Account>(
      doc(Db, `group/${groupId}/account/`, email).withConverter<Account>(
        accountDataConverter
      )
    );
  } catch (error) {
    console.error(error);
    throw new Error();
  }
}

/**
 * adminを追加する
 * @param upGradedBy 権限を与えたユーザーのuserId
 * @param memberId adminに追加するuserId
 * @param groupId 追加するgroupId
 */
async function addAdmin(
  upGradedBy: string,
  memberId: string,
  groupId: string
): Promise<void> {
  try {
    const admin: Readonly<Admin> = {
      upGraded: serverTimestamp(),
      upGradedBy: upGradedBy,
    };
    setDoc(
      doc(Db, `group/${groupId}/admin/${memberId}`).withConverter(
        adminDataConverter
      ),
      admin
    );

    return;
  } catch (error) {
    console.error(error);
    throw new Error();
  }
}

export async function getAdmin(
  memberId: string,
  groupId: string
): Promise<DocumentSnapshot<Admin>> {
  try {
    return await getDoc(
      doc(Db, `group/${groupId}/admin/${memberId}`).withConverter(
        adminDataConverter
      )
    );
  } catch (error) {
    console.error(error);
    throw new Error();
  }
}

/**
 * Groupのアップデート
 * @param group 設定後のオブジェクト
 * @param id 設定するGroupのid
 * @param option
 * @returns Promise
 */

async function setGroup(
  group: Group,
  id?: string,
  option?: SetOptions
): Promise<void> {
  try {
    return await setDoc(
      doc(Db, `group/${id}`).withConverter(groupDataConverter),
      group,
      option ?? {}
    );
  } catch (error) {
    console.error(error);
    throw new Error();
  }
}

const getGroup = async (
  id: string
): Promise<Readonly<DocumentSnapshot<Group>> | null> => {
  try {
    const group = await getDoc(
      doc(Db, `group/${id}`).withConverter(groupDataConverter)
    );
    return group ?? null;
  } catch (error) {
    throw new Error(`Invalid data: ${error}`);
  }
};

const addWork = async (
  groupId: string,
  activity: activity<work>
): Promise<string> => {
  try {
    const data = await addDoc(
      collection(Db, `group/${groupId}/activity`).withConverter(
        activityDataConverter
      ),
      activity
    );
    if (activity.memberId)
      await setMemberStatus(
        activity.content?.status == 'running' ? 'active' : 'inactive',
        activity.memberId,
        groupId
      );
    return data.id;
  } catch (error) {
    console.error(error);
    throw new Error();
  }
};
const setWork = async (
  groupId: string,
  workId: string,
  activity: Partial<activity<work>>,
  option: SetOptions
): Promise<void> => {
  try {
    await setDoc(
      doc(Db, `group/${groupId}/activity/${workId}`).withConverter(
        activityDataConverter
      ),
      activity,
      option
    );
    if (activity.memberId)
      await setMemberStatus(
        activity.content?.status == 'running' ? 'active' : 'inactive',
        activity.memberId,
        groupId
      );
    return;
  } catch (error) {
    console.error(error);
    throw new Error();
  }
};

const getUserActivity = async (
  groupId: string,
  count: number,
  memberId?: string,
  type?: activityType
): Promise<QueryDocumentSnapshot<activity<work>>[]> => {
  try {
    const q = await getDocs(
      query(
        collection(Db, `group/${groupId}/activity/`).withConverter(
          activityDataConverter
        ),
        where('type', '==', type),
        where('memberId', '==', memberId),
        orderBy(''),
        limit(count)
      )
    );

    const data: QueryDocumentSnapshot<activity<work>>[] = [];
    q.forEach((activity) => {
      data.push(activity);
    });
    return data;
  } catch (error) {
    console.error(error);
    throw new Error();
  }
};

export const getActivitySnapshot = async (
  activityId: string,
  groupId: string
): Promise<DocumentSnapshot<activity<work>>> => {
  return await getDoc(
    doc(Db, `group/${groupId}/activity/${activityId}`).withConverter(
      activityDataConverter
    )
  );
};

const getUserActivities = async (
  groupId: string,
  memberId: string,
  limitCount?: number,
  startAtId?: unknown
): Promise<QuerySnapshot<activity<work>>> => {
  try {
    const filters = [
      where('memberId', '==', memberId),
      orderBy('updated', 'desc'),
    ];
    if (startAtId) console.info('startAtId');
    if (startAtId) filters.push(startAfter(startAtId));
    if (limitCount) filters.push(limit(limitCount));
    const q = await getDocs(
      query(
        collection(Db, `group/${groupId}/activity/`).withConverter(
          activityDataConverter
        ),
        ...filters
      )
    );

    return q;
  } catch (error) {
    console.error(error);
    throw new Error();
  }
};

const getAllActivities = async (
  groupId: string,
  limitCount?: number,
  startAtDocument?: DocumentSnapshot
): Promise<QueryDocumentSnapshot<activity<work>>[]> => {
  try {
    const filters = [orderBy('updated', 'desc')];
    if (limitCount) filters.push(limit(limitCount));
    if (startAtDocument) filters.push(startAfter(startAtDocument));
    const q = await getDocs(
      query(
        collection(Db, `group/${groupId}/activity/`).withConverter(
          activityDataConverter
        ),
        ...filters
      )
    );

    const dataSet: QueryDocumentSnapshot<activity<work>>[] = [];
    q.forEach((data) => {
      dataSet.push(data);
    });
    return dataSet;
  } catch (error) {
    console.error(error);
    throw new Error();
  }
};

const getLatestActivity = async (
  groupId: string,
  memberId: string
): Promise<QueryDocumentSnapshot<activity<work>>> => {
  try {
    const q = await getDocs(
      query(
        collection(Db, `group/${groupId}/activity/`).withConverter(
          activityDataConverter
        ),
        where('memberId', '==', memberId),
        orderBy('updated', 'desc'),
        limit(1)
      )
    );
    const data: QueryDocumentSnapshot<activity<work>>[] = [];
    q.forEach((s) => {
      data.push(s);
    });
    return data[0];
  } catch (error) {
    console.error(error);
    throw new Error();
  }
};

export {
  setGroup,
  getGroup,
  addAccount,
  addAdmin,
  setWork,
  createGroup,
  addWork,
  getUserActivity,
  getUserActivities,
  getAllActivities,
  getLatestActivity,
  getAccount,
};
