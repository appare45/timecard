import { firebase } from './../utils/firebase';
import { Db } from './firebase';

type Admin = {
  upGraded: firebase.firestore.FieldValue;
  upGradedBy: string;
};

//** 管理はメンバーベースで行う */
type Account = {
  memberId: string;
};

type Member = {
  name: string;
};

export type Group = {
  name: string;
  joinStatus: boolean;
  created: firebase.firestore.FieldValue;
  authorId: string;
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

const createGroup = (
  group: { name: string; joinStatus: boolean },
  author: { id: string; name: string }
): Promise<string> => {
  try {
    const _group: Readonly<Group> = {
      name: group.name,
      joinStatus: group.joinStatus,
      authorId: author.id,
      created: firebase.firestore.FieldValue.serverTimestamp(),
    };
    return Db.collection('group')
      .withConverter(groupDataConverter)
      .add(_group)
      .then((group_1) => {
        addMember({ name: author.name }, group_1.id).then((memberId) => {
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
    await Db.collection('group')
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

/**
 * メンバーを追加する
 * @param name 表示名
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

export { setGroup, getGroup, addAccount, addAdmin, addMember, createGroup };
