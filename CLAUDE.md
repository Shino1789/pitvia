# CLAUDE.md

このファイルは、このリポジトリで作業する際に Claude Code へプロジェクト固有の情報や開発ルールを伝えるためのガイドです。

---

# プロジェクト概要

Pitvia（走るクルマのための整備記録・ショップ連携アプリ）は、スポーツカー・旧車・カスタムカーのオーナー向けの整備記録・ショップ連携Webアプリです。

本プロジェクトは、フロントエンドとバックエンドを独立して開発・デプロイできるモノレポ構成となっています。

- `apps/web`
  - Next.js 16（App Router）
  - TypeScript
  - フロントエンド

- `apps/api`
  - Spring Boot 3（Java 21）
  - パッケージルート：`com.pitvia.api`
  - バックエンドAPI

設計資料は `docs/` 配下に配置されています。

- `docs/db/schema.dbml`
  - ER図（DBML）

- `docs/api/openapi.yaml`
  - OpenAPI仕様

- `docs/api/bruno/`
  - Bruno APIコレクション

- `docs/architecture/architecture.drawio`
  - システム構成図

- `docs/ui/figma-link.md`
  - Figma画面UIモック

---

# 開発環境

アプリケーション全体は Docker Compose により起動します。

構成は以下の通りです。

- Next.js
- Spring Boot
- PostgreSQL
- MinIO

ルートディレクトリには `package.json` は存在せず、各アプリケーションごとに管理されています。

## 開発用スクリプト

```bash
./scripts/up.sh
```

全コンテナを起動し、Web・APIのヘルスチェック完了後にブラウザを開きます。

```bash
./scripts/down.sh
```

全コンテナを停止します。

```bash
./scripts/logs.sh
```

全コンテナのログを表示します。

```bash
./scripts/reset.sh
```

コンテナ・Volume を削除します。

以下のデータも削除されます。

- PostgreSQL
- node_modules
- MinIOデータ

---

Docker Compose は

```
docker-compose.dev.yml
```

を使用します。

環境変数は

```
.env.dev
```

を利用します。

必要に応じて

```
.env.example
```

をコピーして作成してください。

### 起動するサービス

- web
  - Next.js（ホットリロード）

- api
  - Spring Boot
  - `./gradlew bootRun`
  - ホットリロード対応

- db
  - PostgreSQL 17

- minio

- create-bucket
  - 初回起動時のみ実行
  - バケット作成
  - ポリシー設定
  - 整備写真保存用オブジェクトストレージ初期化

---

# フロントエンド（apps/web）

## 起動

```bash
npm run dev
```

Next.js 開発サーバー起動

---

## ビルド

```bash
npm run build
```

---

## Lint

```bash
npm run lint
```

---

## テスト

```bash
npm test
```

Vitest実行

---

## Watchモード

```bash
npm run test:watch
```

---

## 単体テスト実行

```bash
npx vitest run src/features/auth/hooks/use-login.test.ts
```

テスト環境

- jsdom
- globals有効
- setupファイル：`vitest.setup.ts`
- `@/` は `src/` のエイリアス（`vitest.config.ts`）

---

# バックエンド（apps/api）

## 起動

```bash
./gradlew bootRun
```

`SPRING_PROFILES_ACTIVE=dev`

の場合は

```
application-dev.yml
```

を利用します。

---

## 全テスト実行

```bash
./gradlew test
```

JUnit5

---

## 単体テスト実行

```bash
./gradlew test --tests "com.pitvia.api.auth.controller.AuthControllerTest"
```

---

統合テストでは Testcontainers を使用しています。

利用ライブラリ

- spring-boot-testcontainers
- postgresql

Docker が起動している必要があります。

テスト設定

```
apps/api/src/test/resources/application-test.yml
```

---

CI

```
.github/workflows/test.yml
```

では

フロント

```
npm run lint
npm test
```

バックエンド

```
./gradlew test
```

を

- Pull Request
- main
- develop

への Push 時に実行します。

---

# バックエンド設計（apps/api）

パッケージは Feature 単位で構成されています。

```
com.pitvia.api
```

配下

- auth
- dashboard
- maintenance
- master
- shop
- token
- user
- vehicle
- health
- common
- config

各 Feature は必要に応じて

- controller
- service
- repository
- entity
- dto
- constant

のレイヤー構成を採用しています。

---

## 認証

Spring Security による JWT認証を採用しています。

特徴

- セッションレス認証
- CSRF無効
- SessionCreationPolicy.STATELESS

フィルター順

```
MdcLoggingFilter
↓

LoggingFilter
↓

JwtAuthenticationFilter
```

アクセストークン

- 有効期限15分
- レスポンスボディ返却

リフレッシュトークン

- 有効期限7日
- DB保存
- HttpOnly Cookie
- Cronで期限切れ削除

公開APIは

```
PublicEndpoints.java
```

で一元管理します。

ロール

```
UserRole

OWNER

SHOP
```

---

## APIパス

APIパスは

```
ApiPaths.java
```

で一元管理します。

Controllerで文字列を直接記述しないこと。

---

## レスポンス

レスポンス生成は

```
ResponseFactory
```

を使用します。

成功時

```
ApiResponse<T>
```

失敗時

```
ErrorResponse
```

例外処理は

```
GlobalExceptionHandler
```

に集約します。

新しい業務エラーは

```
BusinessException
```

と

```
ErrorCode
```

を使用してください。

---

## ダッシュボード

ロール別処理には Strategy パターンを採用しています。

DashboardService は

```
Map<UserRole, DashboardQuery>
```

で実装されています。

ロール判定で

```
if

switch
```

を使用しません。

同様のロール別機能では、この実装方式を踏襲してください。

---

## DBマイグレーション

Flyway を利用しています。

配置場所

```
src/main/resources/db/migration/  … 実スキーマ（本番にも適用）
src/main/resources/db/mock/       … development/test専用のモック・テストデータ
```

命名規則

```
V1__xxxx.sql
```

開発用データ

```
V1000__mock_data.sql
V1001__test_chart_scale.sql
```

実スキーマは

```
V1000未満
```

開発データは

```
V1000以上
```

としてください。

本番（production）にモック・テストデータを絶対に投入しないよう、`spring.flyway.locations` を
Spring Profileごとに出し分けています。

```
application.yaml       … classpath:db/migration（共通・本番デフォルト）
application-dev.yml    … classpath:db/migration,classpath:db/mock
application-test.yml   … classpath:db/migration,classpath:db/mock
```

`db/mock/` 配下に新しいファイルを追加する場合も、上記のバージョン番号規則（V1000以上）に従ってください。

---

## 設定

共通設定

```
application.yml
```

環境別

```
application-dev.yml
application-prod.yml
```

環境変数で管理

- DB
- JWT
- CORS
- Cookie
- Storage

詳細は

```
.env.example
```

を参照してください。

---

# フロントエンド設計（apps/web）

Feature Slice 構成を採用しています。

```
src/

app/

features/

shared/

lib/api/

providers/

stores/
```

## 認証

アクセストークン

- Zustandのみ保持
- 永続化しない

リフレッシュトークン

- HttpOnly Cookie

middleware.ts により

- 未ログイン
- ログイン済み

を判定します。

401発生時は Axios Interceptor が

- リフレッシュ
- リクエスト再送
- ログイン画面遷移

を制御します。

---

## データ取得

TanStack Query を使用します。

各 Feature の

```
queries/
```

で Query を管理します。

ログアウト時は

```
queryClient.clear()
```

を実行します。

---

## フォーム

以下を使用します。

- React Hook Form
- Zod
- @hookform/resolvers

---

## UI

使用ライブラリ

- Tailwind CSS v4
- Radix UI
- class-variance-authority
- tailwind-merge
- Recharts
- Sonner

---

## ルーティング

画面ルート

```
shared/constants/routes.ts
```

APIエンドポイント

```
lib/api/endpoints.ts
```

で一元管理します。

文字列を直接記述しないこと。

---

## テスト

テストコードは対象ファイルと同じディレクトリに配置します。

```
*.test.ts
*.test.tsx
```

テストライブラリ

- Vitest
- Testing Library

## Claudeへの指示

ユーザーとの会話(回答・説明・レビュー・エラーの解説等)は日本語で行ってください。

既存実装を必ず参考にしてください。

命名規則やコメントの付け方は既存コードに合わせてください。

必要以上にリファクタリングしないでください。

関係ないファイルは編集しないでください。

ビルド・テストを実行してください。

保守性や拡張性を意識し、ベストプラクティスで実装して下さい。

新しい設計やライブラリの導入を推奨する場合は、実装前に理由を説明してください。

## 編集ポリシー

- 必要最小限の変更に留める
- 関係ないファイルは変更しない
- リファクタリングを勝手に行わない
- 既存コードを優先して再利用する
- commit・push・merge、新規ブランチを作成・削除はユーザーの指示があるまで勝手に行わない
