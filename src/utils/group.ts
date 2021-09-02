import { QueryDocumentSnapshot, Timestamp } from '@firebase/firestore-types';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from 'firebase/firestore';
import { app, firebase } from './../utils/firebase';
const Db = getFirestore(app);

type Admin = {
  upGraded: firebase.firestore.FieldValue;
  upGradedBy: string;
};

//** 管理はメンバーベースで行う */
type Account = {
  memberId: string;
};

export type Member = {
  name: string;
  photoUrl?: string;
};

export type Group = {
  name: string;
  joinStatus: boolean;
  created: firebase.firestore.FieldValue;
  authorId: string;
};

type activityType = 'work';

export type activity<T> = {
  type: activityType;
  memberId: string;
  content: T;
  updated?: firebase.firestore.Timestamp;
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

const isAccount = (item: { memberId?: unknown }): item is Account => {
  if (!(item.memberId && typeof item.memberId == 'string')) {
    return false;
  }
  return true;
};

const isMember = (item: { name?: unknown }): item is Member => {
  if (!(item.name && typeof item.name == 'string')) {
    return false;
  }
  return true;
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

const groupDataConverter = {
  toFirestore(group: Partial<Group>): firebase.firestore.DocumentData {
    return group;
  },
  fromFirestore(
    snapshot: firebase.firestore.QueryDocumentSnapshot,
    option: firebase.firestore.SnapshotOptions
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
    snapshot: firebase.firestore.QueryDocumentSnapshot,
    option?: firebase.firestore.SnapshotOptions
  ): Member {
    const data = snapshot.data(option);
    if (!isMember(data)) {
      console.error('Invalid member data');
      throw new Error('データの取得に失敗しました');
    }
    return {
      name: data.name,
    };
  },
};

const accountDataConverter = {
  toFirestore(account: Account): firebase.firestore.DocumentData {
    if (!isAccount(account)) {
      throw new Error('データ設定中にエラーが発生しました');
    }
    return {
      memberId: account.memberId,
    };
  },
  fromFirestore(
    snapshot: firebase.firestore.QueryDocumentSnapshot,
    option?: firebase.firestore.SnapshotOptions
  ): Account {
    const data = snapshot.data(option);
    if (!isAccount(data)) {
      throw new Error('データ取得時にエラーが発生しました');
    }
    return {
      memberId: data.memberId,
    };
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
    snapshot: firebase.firestore.QueryDocumentSnapshot,
    option?: firebase.firestore.SnapshotOptions
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
  toFirestore(
    activity: Partial<activity<work>>
  ): firebase.firestore.DocumentData {
    const data = activity;
    data.updated = firebase.firestore.Timestamp.now();
    return activity;
  },
  fromFirestore(
    snapshot: firebase.firestore.QueryDocumentSnapshot,
    option?: firebase.firestore.SnapshotOptions
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
      created: firebase.firestore.FieldValue.serverTimestamp(),
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
    throw new Error(error);
  }
};

async function addAccount(
  accountId: string,
  account: Account,
  groupId: string
): Promise<void> {
  try {
    await addDoc(Db, 'group/account');
    Db.collection('group')
      .doc(groupId)
      .collection('account')
      .doc(accountId)
      .withConverter(accountDataConverter)
      .set(account);
    return;
  } catch (e) {
    throw new Error(e);
  }
}

async function getAccount(
  memberId: string,
  groupId: string
): Promise<firebase.firestore.DocumentSnapshot<Account>> {
  try {
    return await Db.collection('group')
      .doc(groupId)
      .collection('account')
      .withConverter(accountDataConverter)
      .doc(memberId)
      .get();
  } catch (error) {
    throw new Error(error);
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
    const group = await Db.collection('group')
      .doc(groupId)
      .collection('member')
      .withConverter(memberDataConverter)
      .add(member);
    return group.id;
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
}

async function getMember(id: string, groupId: string): Promise<Member | null> {
  try {
    const member = await Db.collection('group')
      .doc(groupId)
      .collection('member')
      .withConverter(memberDataConverter)
      .doc(id)
      .get();
    return member.data() ?? null;
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
    Db.collection('group')
      .doc(groupId)
      .collection('admin')
      .doc(memberId)
      .withConverter(adminDataConverter)
      .set(admin);
    return;
  } catch (error) {
    console.error(error);
    throw new Error(error);
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
    return await Db.collection('group')
      .doc(id)
      .withConverter(groupDataConverter)
      .set(group, option ?? {});
  } catch (error) {
    throw new Error(error);
  }
}

const getGroup = async (id: string): Promise<Readonly<Group> | null> => {
  try {
    const group = await Db.collection('group')
      .doc(id)
      .withConverter(groupDataConverter)
      .get();
    return group.data() ?? null;
  } catch (error) {
    throw new Error(`Invalid data: ${error}`);
  }
};

const listMembers = async (
  id: string,
  option?: firebase.firestore.GetOptions
): Promise<Readonly<firebase.firestore.QuerySnapshot<Member> | null> | null> => {
  try {
    return await Db.collection('group')
      .doc(id)
      .collection('member')
      .withConverter(memberDataConverter)
      .get(option);
  } catch (error) {
    throw new Error(error);
  }
};

const addWork = async (
  groupId: string,
  activity: activity<work>
): Promise<string> => {
  try {
    const data = await Db.collection('group')
      .doc(groupId)
      .collection('activity')
      .withConverter(activityDataConverter)
      .add(activity);
    return data.id;
  } catch (error) {
    throw new Error(error);
  }
};
const setWork = async (
  groupId: string,
  workId: string,
  activity: Partial<activity<work>>,
  option: firebase.firestore.SetOptions
): Promise<void> => {
  try {
    await Db.collection('group')
      .doc(groupId)
      .collection('activity')
      .doc(workId)
      .withConverter(activityDataConverter)
      .set(activity, option);
    return;
  } catch (error) {
    throw new Error(error);
  }
};

const getUserActivity = async (
  groupId: string,
  limit: number,
  memberId?: string,
  type?: activityType
): Promise<QueryDocumentSnapshot<activity<work>>[]> => {
  try {
    const query = await Db.collection('group')
      .doc(groupId)
      .collection('activity')
      .withConverter(activityDataConverter)
      .where('type', '==', type)
      .where('memberId', '==', memberId)
      .limit(limit)
      .get();
    const data: QueryDocumentSnapshot<activity<work>>[] = [];
    query.forEach((activity) => {
      data.push(activity);
    });
    return data;
  } catch (error) {
    throw new Error(error);
  }
};

const getUserActivities = async (
  groupId: string,
  memberId: string
): Promise<QueryDocumentSnapshot<activity<work>>[]> => {
  try {
    const query = await Db.collection('group')
      .doc(groupId)
      .collection('activity')
      .withConverter(activityDataConverter)
      .where('memberId', '==', memberId)
      .orderBy('updated', 'desc')
      .get();
    const dataSet: QueryDocumentSnapshot<activity<work>>[] = [];
    query.forEach((data) => {
      dataSet.push(data);
    });
    return dataSet;
  } catch (error) {
    throw new Error(error);
  }
};

const getAllActivities = async (
  groupId: string
): Promise<QueryDocumentSnapshot<activity<work>>[]> => {
  try {
    const query = await Db.collection('group')
      .doc(groupId)
      .collection('activity')
      .withConverter(activityDataConverter)
      .orderBy('updated', 'desc')
      .get();
    const dataSet: QueryDocumentSnapshot<activity<work>>[] = [];
    query.forEach((data) => {
      dataSet.push(data);
    });
    return dataSet;
  } catch (error) {
    throw new Error(error);
  }
};

const getLatestActivity = async (
  groupId: string,
  memberId: string
): Promise<firebase.firestore.QueryDocumentSnapshot<activity<work>>> => {
  try {
    const query = await Db.collection('group')
      .doc(groupId)
      .collection('activity')
      .withConverter(activityDataConverter)
      .where('memberId', '==', memberId)
      .orderBy('updated', 'desc')
      .limit(1)
      .get();
    const data: firebase.firestore.QueryDocumentSnapshot<activity<work>>[] = [];
    query.forEach((q) => {
      data.push(q);
    });
    return data[0];
  } catch (error) {
    throw new Error(error);
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
