import * as firebase from '@firebase/testing';
import * as fs from 'fs';

const PROJECT_ID = 'rule-test';
const RULES_PATH = 'firestore.rules';

// 認証付きの firestore appを作成する
// eslint-disable-next-line @typescript-eslint/ban-types
const createAuthApp = (auth?: object): firebase.firestore.Firestore => {
  return firebase
    .initializeTestApp({ projectId: PROJECT_ID, auth: auth })
    .firestore();
};

// ルールファイルの読み込み
beforeAll(async () => {
  await firebase.loadFirestoreRules({
    projectId: PROJECT_ID,
    rules: fs.readFileSync(RULES_PATH, 'utf8'),
  });
});

// Firestoreデータのクリーンアップ
afterEach(async () => {
  await firebase.clearFirestoreData({ projectId: PROJECT_ID });
});

// Firestoreアプリの削除
afterAll(async () => {
  await Promise.all(firebase.apps().map((app) => app.delete()));
});

describe('User Data', () => {
  // user情報への参照を作る
  // テストが完了する度データをクリア
  afterEach(async () => {
    await firebase.clearFirestoreData({ projectId: PROJECT_ID });
  });
  describe('ログインしていない場合ユーザーデータにアクセスできない', () => {
    const db = createAuthApp();
    const usersRef = db.collection('user').doc('alice');
    test('読み込み不可', async () => {
      await firebase.assertFails(usersRef.get());
    });
    test('書き込み不可', async () => {
      await firebase.assertFails(
        usersRef.set({
          name: 'Alice',
        })
      );
    });
    test('削除不可', async () => {
      await firebase.assertFails(usersRef.delete());
    });
  });
  describe('自分のデータにアクセス可能', () => {
    const db = createAuthApp({ uid: 'alice' });
    const userRef = db.collection('user').doc('alice');
    test('読み込み可能', async () => {
      await firebase.assertSucceeds(userRef.get());
    });
    test('書き込み可能', async () => {
      await firebase.assertSucceeds(
        userRef.set({
          name: 'Alice',
        })
      );
    });
    test('更新可能', async () => {
      userRef.set({
        name: 'Alice',
      });
      await firebase.assertSucceeds(
        userRef.update({
          name: 'Alice',
        })
      );
    });
    test('削除不可', async () => {
      await firebase.assertFails(userRef.delete());
    });
  });
  describe('他人のデータにアクセス不可', () => {
    const db1 = createAuthApp({ uid: 'alice' });
    const db2 = createAuthApp({ uid: 'bob' });
    db1.collection('user').doc('alice').set({ name: 'alice' });
    const userRef2 = db2.collection('user').doc('alice');
    test('読み取り・書き込み・削除・更新不可', async () => {
      await firebase.assertFails(userRef2.get());
      await firebase.assertFails(
        userRef2.set({
          name: 'bob',
        })
      );
      await firebase.assertFails(userRef2.delete());
      await firebase.assertFails(userRef2.update({ name: 'bob' }));
    });
  });
});

describe('Group Data', () => {
  afterEach(async () => {
    await firebase.clearFirestoreData({ projectId: PROJECT_ID });
  });
  const uid = 'alice';
  const outsideGroupUserUid = 'bob';
  const groupId = 'test';
  const memberId = 'test-alice';
  const authDb = createAuthApp({ uid: uid });
  const unAuthDb = createAuthApp();
  describe('自分のアカウントへのアクセス', () => {
    const accountRef = authDb
      .collection('group')
      .doc(groupId)
      .collection('account')
      .doc(uid);
    beforeEach(() => {
      accountRef.set({ memberId: memberId });
    });

    const unAuthAccountRef = unAuthDb
      .collection('group')
      .doc(groupId)
      .collection('account')
      .doc(uid);

    test('自分は読み取り・書き込み。更新可能', async () => {
      await firebase.assertSucceeds(accountRef.get());
      await firebase.assertSucceeds(accountRef.set({ memberId: memberId }));
      await firebase.assertSucceeds(accountRef.update({ memberId: 'updated' }));
    });
    test('自分は削除不可', async () => {
      await firebase.assertFails(accountRef.delete());
    });

    test('自分以外は読み取り不可・書き込み・更新・削除', async () => {
      await firebase.assertFails(unAuthAccountRef.get());
      await firebase.assertFails(unAuthAccountRef.set({ memberId: memberId }));
      await firebase.assertFails(
        unAuthAccountRef.update({ memberId: 'updated' })
      );
      await firebase.assertFails(unAuthAccountRef.delete());
    });
  });

  describe('グループ内アクティビティー', () => {
    beforeEach(async () => {
      await authDb
        .collection('group')
        .doc(groupId)
        .collection('account')
        .doc(uid)
        .set({ memberId: memberId });
    });
    const activityRef = authDb
      .collection('group')
      .doc(groupId)
      .collection('activity')
      .doc(uid);

    test('自分は作成可能', async () => {
      await firebase.assertSucceeds(activityRef.set({ memberId: memberId }));
    });

    test('自分は読み取り・更新・書き込み可能', async () => {
      activityRef.set({ memberId: memberId });
      await firebase.assertSucceeds(activityRef.get());
      await firebase.assertSucceeds(
        activityRef.update({ memberId: 'updated' })
      );
      await firebase.assertFails(activityRef.delete());
    });

    test('グループメンバー以外は読み取り・書き込み・削除不可', async () => {
      const outSideGroupActivityRef = createAuthApp({
        uid: outsideGroupUserUid,
      })
        .collection('group')
        .doc(groupId)
        .collection('account')
        .doc(uid);
      activityRef.set({ memberId: memberId });
      await firebase.assertFails(outSideGroupActivityRef.get());
      await firebase.assertFails(
        outSideGroupActivityRef.set({ memberId: memberId })
      );
      await firebase.assertFails(
        outSideGroupActivityRef.update({ memberId: 'updated' })
      );
      await firebase.assertFails(outSideGroupActivityRef.delete());
    });
  });

  describe('グループ情報', () => {
    beforeEach(async () => {
      await authDb
        .collection('group')
        .doc(groupId)
        .collection('account')
        .doc(uid)
        .set({ memberId: memberId });
    });
    const groupRef = authDb.collection('group').doc(groupId);

    test('自分は読み取り可能', async () => {
      await firebase.assertSucceeds(groupRef.get());
    });

    test('グループメンバー以外は読み取り・書き込み・削除不可', async () => {
      const outSideGroupActivityRef = createAuthApp({
        uid: outsideGroupUserUid,
      })
        .collection('group')
        .doc(groupId);
      await firebase.assertFails(outSideGroupActivityRef.get());
      await firebase.assertFails(
        outSideGroupActivityRef.set({ memberId: memberId })
      );
      await firebase.assertFails(
        outSideGroupActivityRef.update({ memberId: 'updated' })
      );
      await firebase.assertFails(outSideGroupActivityRef.delete());
    });
  });

  describe('メンバーデータ', () => {
    beforeEach(async () => {
      await authDb
        .collection('group')
        .doc(groupId)
        .collection('account')
        .doc(uid)
        .set({ memberId: memberId });
    });
    const memberRef = authDb
      .collection('group')
      .doc(groupId)
      .collection('member')
      .doc(memberId);

    test('自分は作成可能', async () => {
      await firebase.assertSucceeds(memberRef.set({ name: 'Test' }));
    });

    test('自分は読み取り・更新・書き込み可能', async () => {
      memberRef.set({ name: 'Test' });
      await firebase.assertSucceeds(memberRef.get());
      await firebase.assertSucceeds(memberRef.update({ name: 'updated' }));
      await firebase.assertFails(memberRef.delete());
    });

    test('グループメンバー以外は読み取り・書き込み・削除不可', async () => {
      const outSideGroupActivityRef = createAuthApp({
        uid: outsideGroupUserUid,
      })
        .collection('group')
        .doc(groupId)
        .collection('account')
        .doc(uid);
      memberRef.set({ name: 'Test' });
      await firebase.assertFails(outSideGroupActivityRef.get());
      await firebase.assertFails(outSideGroupActivityRef.set({ name: 'Test' }));
      await firebase.assertFails(
        outSideGroupActivityRef.update({ name: 'updated' })
      );
      await firebase.assertFails(outSideGroupActivityRef.delete());
    });
  });
});
