import * as firebase from '@firebase/testing';
import * as fs from 'fs';

const PROJECT_ID = 'rule-test';
const RULES_PATH = 'firestore.rules';

// 認証付きのFreistore appを作成する
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
    test('読み取り不可', async () => {
      firebase.assertFails(userRef2.get());
    });
    test('書き込み不可', async () => {
      firebase.assertFails(
        userRef2.set({
          name: 'bob',
        })
      );
    });
    test('削除不可', async () => {
      firebase.assertFails(userRef2.delete());
    });
    test('更新不可', async () => {
      firebase.assertFails(userRef2.update({ name: 'bob' }));
    });
  });
});
