import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  authorizedEnvironments,
  unAuthorizedEnvironment,
} from './firestore.test';
import { data } from './random-data';

describe('Create / Edit User', () => {
  test('Logged in user can create own user record ', async () => {
    await assertSucceeds(
      setDoc(
        doc(authorizedEnvironments[0].firestore(), `user/${data[0].name}`),
        {}
      )
    );
  });

  test("Not logged in user can't create own user record", async () => {
    await assertFails(
      setDoc(doc(unAuthorizedEnvironment.firestore(), `user/test`), {})
    );
  });

  test("Can't create another user's record", async () => {
    assertFails(
      setDoc(
        doc(authorizedEnvironments[0].firestore(), `user/${data[1].name}`),
        {}
      )
    );
  });
});
