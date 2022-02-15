import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';

// test environment
export let testEnv: RulesTestEnvironment;
beforeAll(async () => {
  // テスト環境の初期化
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-clubroom-testing',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf-8'),
    },
  });
});

afterEach(() => {
  testEnv.cleanup();
});

// 動作チェック
test('Check jet', () => {
  expect(2 + 2).toBe(4);
});
