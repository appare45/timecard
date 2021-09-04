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
} from 'firebase/firestore';
import { app, firebase } from './../utils/firebase';
const Db = getFirestore(app);

type Admin = {
  upGraded: firebase.firestore.FieldValue;
  upGradedBy: string;
};

//** 管理はメンバーベースで行う */
class Account {
  constructor(readonly memberId: string) {
    this.memberId = memberId;
  }
}

export class Member {
  public set name(v: string) {
    if (v.length < 20) this.name = v;
  }
  constructor(name: string, readonly photoUrl: string | null = null) {
    this.name = name;
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
  updated?: FieldValue;
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

const isActivity = (item: {
  type?: unknown;
  content?: unknown;
  status?: unknown;
}): item is activity<work> => {
  if (!(item?.type && typeof item.type === 'string')) {
    return false;
  }
  if (!item?.content) {
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
  toFirestore(group: Group): firebase.firestore.DocumentData {
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
  toFirestore(member: Member): firebase.firestore.DocumentData {
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
  toFirestore(
    account: WithFieldValue<Account>
  ): firebase.firestore.DocumentData {
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
  toFirestore(admin: Admin): firebase.firestore.DocumentData {
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
  toFirestore(activity: activity<work>): firebase.firestore.DocumentData {
    const data = activity;
    data.updated = firebase.firestore.Timestamp.now();
    return activity;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    option?: SnapshotOptions
  ): activity<work> {
    const data = snapshot.data(option);
    if (!isActivity(data)) {
      throw new Error('データ取得中にエラーが発生しました');
    }
    return data;
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
): Promise<Member | null> {
  try {
    const member = getDoc(
      doc(Db, `group/${groupId}/member/${memberId}`).withConverter(
        memberDataConverter
      )
    );

    return (await member).data() ?? null;
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
      upGraded: firebase.firestore.FieldValue.serverTimestamp(),
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
  option?: firebase.firestore.SetOptions
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
  limitNumber: number
): Promise<Readonly<QuerySnapshot<Member> | null> | null> => {
  try {
    return await getDocs(
      query(
        collection(Db, `group/${id}/member`),
        orderBy(''),
        limit(limitNumber)
      ).withConverter(memberDataConverter)
    );
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
        accountDataConverter
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
  option: firebase.firestore.SetOptions
): Promise<void> => {
  try {
    await setDoc(
      doc(Db, `group/${groupId}/activity/${workId}`).withConverter(
        accountDataConverter
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

const getUserActivities = async (
  groupId: string,
  memberId: string
): Promise<QueryDocumentSnapshot<activity<work>>[]> => {
  try {
    const q = await getDocs(
      query(
        collection(Db, `group/${groupId}/activity/`).withConverter(
          activityDataConverter
        ),
        where('memberId', '==', memberId),
        orderBy('updated', 'desc')
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

const getAllActivities = async (
  groupId: string
): Promise<QueryDocumentSnapshot<activity<work>>[]> => {
  try {
    const q = await getDocs(
      query(
        collection(Db, `group/${groupId}/activity/`).withConverter(
          activityDataConverter
        )
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
