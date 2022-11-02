[![Deploy to Firebase Hosting on merge](https://github.com/appare45/Clubroom/actions/workflows/firebase-hosting-merge.yml/badge.svg?branch=main)](https://github.com/appare45/Clubroom/actions/workflows/firebase-hosting-merge.yml)
| branch | CI status |
| --- | --- |
| main | [![Node.js CI](https://github.com/appare45/timecard/actions/workflows/build.yml/badge.svg)](https://github.com/appare45/timecard/actions/workflows/build.yml) |
| develop | [![Node.js CI](https://github.com/appare45/timecard/actions/workflows/build.yml/badge.svg?branch=develop)](https://github.com/appare45/timecard/actions/workflows/build.yml) |

# Clubroom

物理研究部出欠管理システム Clubroom

- [ログイン](https://clubroom.appare45.com/)
- 運用費 0 円

## 構成

![システム構成図](./system.svg)

### フロントエンド

- React
  - JavaScript フレームワーク
  - HTML の生成に利用
- Chakra UI
  - 主に UI コンポーネントに使用
- Vite
  - ビルドに使用

### バックエンド

- Cloudflare Pages
  - ページの配信に使用
  - Firebase Hosting の方が優秀な可能性あり
- Firestore
  - データの保管に使用
- Firebase Authentication
  - ユーザー認証に使用

## 開発

管理者の方はメールアドレスを記載の上で[kaibatsu35.7m45@gmail.com](mailto:kaibatsu35.7m45@gmail.com)までご連絡ください。  
管理を行ってくれる方も探しています。  
本アプリは Node.js を用いて開発されています。

### 開発サーバーの起動

```bash
# npm run dev
yarn dev
```

### 仮想環境（エミュレーター）の起動

```bash
# npm run preview
yarn preview
```

データ等も含めて起動します

### 環境変数

以下の通り環境変数を設定してください。  
環境変数は`.env`ファイルを現在のディレクトリに置くことで設定されます

```
VITE_FIREBASE_API_KEY = <firebase api key>
VITE_FIREBASE_APP_ID = <firebase のapp id>
VITE_FIREBASE_MEASUREMENT_ID = <firebaseのmeasurement id>
VITE_FIREBASE_PROJECT_ID = <firebaseのproject id>
```
