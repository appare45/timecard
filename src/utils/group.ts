import { OrderByDirection } from '@firebase/firestore-types';
import {
  Timestamp,
  QueryDocumentSnapshot,
  getFirestore,
  collection,
  query,
  Query,
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
  QueryConstraint,
  FieldPath,
  DocumentData,
  SetOptions,
  startAt,
} from 'firebase/firestore';
import { app } from './../utils/firebase';
const Db = getFirestore(app);

type Admin = {
  upGraded: FieldValue;
  upGradedBy: string;
};

//** 管理はメンバーベースで行う */
class Account {
  constructor(readonly memberId: string) {
    this.memberId = memberId;
  }
}

export class Member {
  name = '';
  photoUrl = '';
  constructor(name: string, photoUrl: string | null = null) {
    this.name = name;
    if (photoUrl) this.photoUrl = photoUrl;
  }
}

export class Group {
  constructor(
    readonly name: string,
    readonly joinStatus: boolean,
    readonly created: FieldValue,
    readonly authorId: string
  ) {}
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
const isAdmin = (item: {
  upGraded?: unknown;
  upGradedBy?: unknown;
}): item is Admin => {
  if (!item?.upGraded) {
    return false;
  }
  if (!(item.upGradedBy && typeof item.upGradedBy == 'string')) {
    return false;
  }
  return true;
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

const memberDataConverter = {
  toFirestore(member: Member): DocumentData {
    return member;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    option?: SnapshotOptions
  ): Member {
    const data = snapshot.data(option);
    return new Member(data.name);
  },
};

const accountDataConverter: FirestoreDataConverter<Account> = {
  toFirestore(account: WithFieldValue<Account>): DocumentData {
    return {
      memberId: account.memberId,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    option?: SnapshotOptions
  ): Account {
    const data = snapshot.data(option);
    return new Account(data.memberId);
  },
};

const adminDataConverter = {
  toFirestore(admin: Admin): DocumentData {
    return {
      upgraded: admin.upGraded,
      upgradedBy: admin.upGradedBy,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    option?: SnapshotOptions
  ): Admin {
    const data = snapshot.data(option);
    if (!isAdmin(data)) {
      throw new Error('データ取得中にエラーが発生しました');
    }
    return {
      upGraded: data.upGraded,
      upGradedBy: data.upGradedBy,
    };
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
  author: { id: string; name: string; photoUrl: string }
): Promise<string> => {
  try {
    const _group: Readonly<Group> = {
      name: group.name,
      joinStatus: group.joinStatus,
      authorId: author.id,
      created: serverTimestamp(),
    };
    return addDoc(collection(Db, 'group'), _group).then((group_1) => {
      addMember(
        { name: author.name, photoUrl: author.photoUrl },
        group_1.id
      ).then((memberId) => {
        addAccount(author.id, { memberId: memberId }, group_1.id);
        addAdmin(memberId, memberId, group_1.id);
      });
      return group_1.id;
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
  memberId: string,
  groupId: string
): Promise<DocumentSnapshot<Account>> {
  try {
    return await getDoc<Account>(
      doc(Db, `group/${groupId}/account/`, memberId).withConverter<Account>(
        accountDataConverter
      )
    );
  } catch (error) {
    console.error(error);
    throw new Error();
  }
}

/**
 * メンバーを追加する
 * @param member メンバーのデータ
 * @param groupId 追加するグループ名
 * @returns メンバーのID
 */
async function addMember(member: Member, groupId: string): Promise<string> {
  try {
    const group = await addDoc<Member>(
      collection(Db, `group/${groupId}/member/`).withConverter(
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

async function getMember(
  memberId: string,
  groupId: string
): Promise<DocumentSnapshot<Member> | null> {
  try {
    const member = getDoc(
      doc(Db, `group/${groupId}/member/${memberId}`).withConverter(
        memberDataConverter
      )
    );

    return await member;
  } catch (error) {
    return null;
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

const getGroup = async (id: string): Promise<Readonly<Group> | null> => {
  try {
    const group = await getDoc(
      doc(Db, `group/${id}`).withConverter(groupDataConverter)
    );
    return group.data() ?? null;
  } catch (error) {
    throw new Error(`Invalid data: ${error}`);
  }
};

const listMembers = async (
  id: string,
  limitNumber?: number,
  order?: [fieldPath: string | FieldPath, directionStr?: OrderByDirection]
): Promise<Readonly<QuerySnapshot<Member> | null> | null> => {
  try {
    if (limitNumber || orderBy) {
      const qcs: QueryConstraint[] = [];
      if (limitNumber) qcs.push(limit(limitNumber));
      if (order) qcs.push(orderBy(...order));
      const q: Query<Member> = query(
        collection(Db, `group/${id}/member`).withConverter(memberDataConverter),
        ...qcs
      );
      return await getDocs(q);
    } else {
      return await getDocs(
        collection(Db, `group/${id}/member`).withConverter(memberDataConverter)
      );
    }
  } catch (error) {
    console.error(error);
    throw new Error();
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
    if (startAtId) filters.push(startAt(startAtId));
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
    const filters = [];
    if (limitCount) filters.push(limit(limitCount));
    if (startAtDocument) filters.push(startAt(startAtDocument));
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
  addMember,
  setWork,
  createGroup,
  listMembers,
  addWork,
  getUserActivity,
  getMember,
  getUserActivities,
  getAllActivities,
  getLatestActivity,
  getAccount,
};
