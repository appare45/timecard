import {
  initializeTestEnvironment,
  RulesTestContext,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { data } from './random-data';

// test environment
export let testEnv: RulesTestEnvironment;
export let unAuthorizedEnvironment: RulesTestContext;
export let authorizedEnvironments: RulesTestContext[];

beforeEach(async () => {
  // テスト環境の初期化
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-clubroom-testing',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf-8'),
    },
  });
  unAuthorizedEnvironment = testEnv.unauthenticatedContext();
  authorizedEnvironments = data.map((e) =>
    testEnv.authenticatedContext(e.name, {
      email: e.email,
    })
  );
});

afterEach(() => {
  testEnv.cleanup();
});

// 動作チェック
test('Check jet', () => {
  expect(2 + 2).toBe(4);
});
