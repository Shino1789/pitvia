# CLAUDE.md

このファイルは、このリポジトリで作業する Claude Code が**設計を壊さないためのルール**を伝えるガイドです。
コードを見れば分かる情報（ファイル一覧・API一覧・バージョン・コマンドの網羅など）は書きません。利用者向けの説明は `README.md` を参照してください。

---

# 1. プロジェクト概要

Pitvia は、スポーツカー・旧車・カスタムカーのオーナー向けの整備記録・ショップ連携Webアプリです。
フロントエンドとバックエンドを独立して開発・デプロイできるモノレポ構成です。

- `apps/web` … Next.js（App Router）/ TypeScript
- `apps/api` … Spring Boot / Java 21（パッケージルート `com.pitvia.api`）
- `infra/` … Terraform（AWS・Vercel）、Dockerfile
- `scripts/` … 開発用（`dev/`）と本番β運用（`prod/`）。詳細は `scripts/README.md`
- ルートに `package.json` はなく、各アプリで独立管理します（バージョンは `package.json` / `build.gradle` が正）。

## 設計資料（`docs/`）

- `docs/db/schema.dbml` … DBML（ER図の元）
- `docs/api/openapi.yaml` … OpenAPI仕様 / `docs/api/bruno/` … Brunoコレクション
- `docs/deployment/` `docs/infrastructure/` `docs/operations/` … 本番βの環境変数・Terraform・停止/復旧手順
- `docs/ui/figma-link.md` … 画面モック / `docs/architecture/` … 構成図

## その他

- ロールは `OWNER` / `SHOP`。コード・DBには `ADMIN` も存在します（登録APIでは拒否、専用機能なし）。**勝手に削除・変更しないこと。**
- 本リポジトリは**独自ライセンス（OSSではない）**です（`LICENSE`）。OSSライセンスの表記やヘッダーを追加しないでください。サードパーティ製ライブラリ（shadcn/ui 等）は各ライセンスに従います。

---

# 2. Claude Code への指示・編集ポリシー

- ユーザーとの会話（回答・説明・レビュー・エラー解説）は日本語で行う。
- **既存実装を必ず参考にする。** 命名規則・コメント・Javadoc の書き方は既存コードに合わせる。
- 必要最小限の変更に留める。無関係なファイルは編集しない。リファクタリングを勝手に行わない(するべきと判断した場合はまず提案)。既存コードを優先して再利用する。
- 新しい設計・ライブラリの導入を推奨する場合は、**実装前に理由を説明**する。
- 保守性および将来の拡張性を意識し、ベストプラクティスを提案して下さい。
- 変更後は、変更領域に応じてビルド・テストを実行する。
  - Frontend: `npm run lint` / `npm test`
  - Backend: `./gradlew test`（**Docker 起動が必須**。Testcontainers を使うため数分かかる）
  - `next build` は `NEXT_PUBLIC_API_URL` が未設定だと失敗し、追跡対象の `apps/web/next-env.d.ts` を書き換える。実行後は意図しない差分を元に戻す。
- バグ・TODO・一時的な実装状況を、このファイルに書かない。

## ユーザーの明示的な指示・承認なしに行ってはいけないこと

- commit / push / merge、ブランチの作成・削除
- 本番β環境の destroy / recovery（§4）
- **既存Migrationの直接編集**、`V3__Insert_demo_data.sql` の削除・移動・書き換え（§7）
- `ADMIN` ロールの削除・変更（§1）
- 認証・認可、Storage、エラー処理の仕組みを独自方式に置き換えること（§5〜§9）

---

# 3. 開発環境

Docker Compose（`docker-compose.dev.yml`）で、web（Next.js）・api（Spring Boot）・db（PostgreSQL 17）・minio（+ バケット初期化）を起動します。

`scripts/dev/` は**ローカルDocker Compose環境専用**です（本番β環境には使わない）。直接実行できます。

```bash
./scripts/dev/up.sh      # 全コンテナ起動（Web・APIのヘルスチェック後にブラウザを開く）
./scripts/dev/down.sh    # 全コンテナ停止
./scripts/dev/logs.sh    # ログ表示
./scripts/dev/reset.sh   # コンテナ・Volume削除（PostgreSQL・node_modules・MinIOデータも初期化）
```

環境変数（いずれもコミットしない。`*.example` をコピーして作成）:

- ルート `.env.dev`（`.env.example` から）… api / db / minio 用
- `apps/web/.env.development`（`apps/web/.env.example` から）… `NEXT_PUBLIC_API_URL` など

---

# 4. 本番β環境（AWS / Vercel）

**本番β環境は実際に課金が発生する実インフラです。開発環境とは完全に別物として扱ってください。**

- 構成: Vercel（Frontend）、AWS ap-northeast-1（ECS/Fargate・RDS PostgreSQL・ECR・ALB・S3・NAT Gateway 等）
- Terraform: `infra/terraform/aws` / `infra/terraform/vercel` / `infra/terraform/bootstrap`（State用S3バケット。Local State）。State は S3 backend。詳細は `docs/infrastructure/terraform.md`
- **Terraform管理外（作成・変更・削除しない）:** Route53 Hosted Zone、ACM、IAM / GitHub OIDC、AWS Budgets

## 運用方針

- AWSコスト削減のため、**必要なときだけTerraformで再構築**する運用です。再構築のたびに RDS は空になり、Flyway が全Migrationを最初から適用します（デモデータ V3 もここで再投入されます）。RDSデータ・S3画像・ECR image・JWT Secret の値は失われます。
- 運用は `scripts/prod/` を使います（開発用 `scripts/dev/` とは別物）。
  - `status.sh` … 状態確認（read-only）
  - `shutdown.sh` … pause + AWS destroy（**破壊的**。二段階の明示的確認が必須）
  - `recover.sh` … Terraform apply + Secret再投入 + GitHub Actions CD + 疎通確認 + Vercel resume
- `recover.sh` は `deploy.yml` を **main ブランチで実行**します。本番に反映したい変更（Migration を含む）は main に入っている必要があります。また `apps/api/**` 等を含む main への push は `deploy.yml`（CD）を自動実行します（本番停止中は失敗し得ます）。
- 詳細は `scripts/README.md`、`docs/operations/shutdown.md`、`docs/operations/recovery.md`。

## 守るべきルール

- 本番βのAWSリソースを直接 `aws` CLI で削除しない。破棄・復旧・状態確認は上記スクリプトを使う。
- `terraform destroy` を手動で実行する場合は、必ず事前に `terraform plan -destroy` で対象を確認する。
- Route53 Hosted Zone / IAM / GitHub OIDC / ACM / AWS Budgets を destroy しない。
- Vercel Project 自体は削除しない（休止は pause、復旧は resume）。
- JWT Secret・RDSマスターパスワード等の Secret 実値を、コード・Terraform State・ログに出力・保存しない。
- **本番β環境の destroy / recovery は破壊的操作のため、ユーザーの明示的な承認なしに実行しない。**

---

# 5. バックエンド（apps/api）

## 構成

- Feature 単位のパッケージ（`com.pitvia.api.{feature}`）。共通機能は `common` / `config`。
- 各 Feature は `controller` / `service` / `repository` / `entity` / `dto` などの既存レイヤーに従います。新しい Feature・クラスは、隣接する Feature の構成・命名を踏襲してください（enum・定数の置き場所も既存パッケージに合わせる）。
- 設定は `application.yaml` / `application-dev.yaml` / `application-prod.yaml`（テストは `application-test.yaml`）。値は環境変数で管理し、一覧は `.env.example` と `docs/deployment/environment-variables.md`。

## 共通規約（新規実装でも再利用する）

- APIパスは `ApiPaths`、公開エンドポイントは `PublicEndpoints` で一元管理。Controller に文字列を直書きしない。
- レスポンスは `ResponseFactory` で生成（成功: `ApiResponse<T>` / 失敗: `ErrorResponse`）。
- 入力検証は Bean Validation。メッセージは `ValidationMessages.properties` のキーを使う。
- Controller は認証ユーザーを `@AuthenticationPrincipal JwtPrincipal` で受け取る。
- `spring.jpa.open-in-view` は無効です。Entity の遅延ロードに依存する処理（DTO変換を含む）は Service のトランザクション内で完結させる。
- 一覧APIの共通仕様: `PageableListParam`（`@ModelAttribute` のパラメータ record）・`PageResponse` を再利用する。ページは1始まり、`size` の上限を守る。**ORDER BY は安定させ、一意キー（ID等）を末尾に含める**（ページ間で順序が入れ替わらないように）。

## 論理削除

- 主要テーブルは `deletedAt` による論理削除です。既存の仕組み（`BaseEntity`、`@SQLDelete` / `@SQLRestriction`）を再利用し、壊さない。
- JPA/JPQL では `@SQLRestriction` が効きますが、**Native SQL / `JdbcClient` で直接SQLを書く場合は、`deleted_at IS NULL` を自分で付ける**（削除済みデータを集計・取得しない）。
- 一覧・検索・集計で、削除済みデータが混入しないことを確認する。

## Storage（画像）

- S3 / MinIO へのアクセスは `StorageService`（検証・キー生成・upload/delete）と `StorageProvider` 経由。**各 Feature から S3 SDK を直接呼ばない。**
- DBトランザクションとの整合は `StorageTransactionManager`（例: 差し替え時の旧ファイル削除は commit 後）を使い、**DBレコードとオブジェクトの不整合を作らない。**
- 孤児クリーンアップ（`OrphanFileCleanupScheduler`）は、`ImageType` のプレフィックス配下で「DB未参照かつ猶予期間超過」のオブジェクトを削除します。新しい画像種別を追加する場合は、`ImageType`・検証ポリシー・`StorageKeyReferenceProvider` をセットで追加する。

## エラー処理

- 業務エラーは `BusinessException` + `ErrorCode`、応答は `GlobalExceptionHandler` に集約する。Feature ごとに独自のエラー応答を作らない。
- `ErrorCode` を追加・変更したら `docs/api/openapi.yaml` も更新する（API仕様と整合させる）。

## テスト

- JUnit5 + MockMvc の結合テスト（`AbstractIntegrationTest`。各テストはトランザクション内で実行）。DB は Testcontainers（PostgreSQL 17）、画像を扱うテストは MinIO コンテナも使用します。
- テストは**自分で必要なユーザー・データを作成**し、シードデータ（V1000 / V3）の件数や存在に依存しない。
- CI: `.github/workflows/test.yml`（PR・main・develop への push で Frontend の lint / test、Backend の test）。本番デプロイ（CD）は `deploy.yml`。

---

# 6. フロントエンド（apps/web）

## 構成（Feature Slice）

- `src/app`（ルート。`(public)` / `(private)`）、`src/features/{feature}`、`src/shared`、`src/lib/api`、`src/providers`、`src/stores`。
- 各 Feature は `api` / `components` / `hooks` / `queries` / `constants` / `schemas` / `types` などで構成します。新機能は既存 Feature の構成を踏襲する。
- 画面ルートは `shared/constants/routes.ts`、APIエンドポイントは `lib/api/endpoints.ts` で一元管理。**文字列を直書きしない。**

## 実装ルール（既存の共通処理を再利用する）

- **API呼び出し:** 各 Feature の `api/` から、共通の `apiClient`（`lib/api/axios.ts`）を使う。Feature ごとに独自の axios / fetch を作らない。
- **データ取得:** TanStack Query。`queries/` に `queryOptions`、キーは `constants/*-keys.ts` に定義する。ログアウト時は `queryClient.clear()`。
- **フォーム:** React Hook Form + Zod（`@hookform/resolvers`）。項目名・メッセージは `shared/constants/field.ts` / `shared/messages` を使う。
- **UI:** Tailwind CSS。shadcn/ui 由来のコンポーネントは **`src/shared/ui/`** にあります（`components.json` の alias は実体と異なるため、shadcn CLI を使う場合は出力先に注意）。
- **通知・エラー表示:** トーストは `appToast`（`lib/toast.ts`）を使い、`sonner` を直接呼ばない。APIエラーの文言は `getErrorMessage`。
- 既存の `shared` の UI・hooks・utils を優先して再利用する。

## テスト

Vitest + Testing Library。テストは対象ファイルと同じディレクトリに `*.test.ts(x)` として置く。

---

# 7. DB / Migration ルール（Flyway）

## `db/migration` と `db/mock` の役割

| 場所                               | 内容                                                         | 適用される環境                                           |
| ---------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| `src/main/resources/db/migration/` | **実スキーマ**（V1, V2 …）と、**本番β用デモデータ（V3）**    | 本番を含む**全環境**（テストの Testcontainers でも毎回） |
| `src/main/resources/db/mock/`      | 開発・テスト専用のモックデータ（`V1000` 以上: V1000, V1001） | dev / test のみ                                          |

- `spring.flyway.locations` をプロファイルで出し分けています（`application.yaml` = `db/migration` のみ、`application-dev.yaml` / `application-test.yaml` = `db/migration` + `db/mock`）。
- **モック・テスト用データは必ず `db/mock`（V1000 以上）に置く。本番に絶対に入れない。** 通常のモックデータを `db/migration` に追加してはいけない。
- 新しい Migration は、`db/migration` の最大バージョンの次の番号で**追加**するのが原則です。Migration を変更するときは、Entity と `docs/db/schema.dbml` も整合させる。

## 既存Migrationの直接編集

- 適用済みの Migration は、原則として直接編集しない。
- ただし現在の Pitvia は β 期間で、本番環境を再構築して Migration を最初から適用できる運用です。そのため、**ユーザーが明示的に指示した場合に限り、既存 Migration の直接編集を許可します。**
- **Claude が自己判断で既存 Migration を書き換えてはいけません。**「β期間だから」を理由にしないこと。
- 直接編集した場合、適用済みの DB は checksum 不一致で起動できなくなります。開発DBは `./scripts/dev/reset.sh` で作り直す。
- Migration を追加・変更したら、**クリーンDBで全 Migration を最初から適用できること**を確認する（`./gradlew test` は毎回新規DBに適用します。開発DBは reset 後に `./scripts/dev/up.sh`）。本番は `db/migration` のみを適用するため、`db/mock`（V1000 / V1001）がなくても適用できること。

## V3（`V3__Insert_demo_data.sql`）は本番β用デモデータ

- 目的: 面接官・採用担当者が本番βで Pitvia を実際に触れるようにするデモ環境（README の Demo Account でログインする）。開発用モックとは別物で、**意図的に `db/migration` に置いている例外**です。
- 内容: デモ用 OWNER 4人・SHOP 1人（`demo-*@example.com`。ログイン可能なのは README 記載の2アカウントのみ）、車両、SHOP との連携（APPROVED）、整備記録（作業項目・部品つき）。
- 設計上の前提（変更時に守る）:
  - 日付は**実行日基準の相対日付**で、未来日を作らない（いつ再構築しても、直近6か月のダッシュボードにデータが出るように）。
  - 画像は登録しない（`vehicles.image_key` は NULL）。`shop_invite_codes` はシードしない（デモ環境で招待コードの発行と連携を試せるようにする）。
  - パスワードは平文を持たず、アプリと同じ BCrypt のハッシュ。パスワードの平文は README を正とし、このファイルには書かない。
  - マスタ（`manufacturers` / `maintenance_types` / `maintenance_categories`）は数値IDでなく **`code` で参照**する。マスタの `code` の変更・削除は V3（と、対応する enum）に影響する。
  - V1000 / V1001 には依存しない（V3 は V1000 より先に実行される）。
- **V3 を削除・移動・書き換えする場合は、ユーザーの確認が必要です。** デモ用メールアドレス・パスワードを変える場合は README も更新する。スキーマ変更で V3 が動かなくならないことも確認する。

---

# 8. 認証・認可ルール

## 認証

- Spring Security + JWT による**ステートレス認証**（セッションなし・CSRF無効）。
- **Access Token:** 短命。レスポンスボディで返し、フロントは Zustand の**メモリのみ**に保持する（localStorage 等に永続化しない）。
- **Refresh Token:** 長命。DB にハッシュで保存し、**HttpOnly Cookie** で扱う。使用ごとにローテーションし（旧トークンは失効）、失効・期限切れは定期削除される。Cookie の属性（Secure / SameSite / Domain）は環境ごとの設定（`application*.yaml`、環境変数 `COOKIE_DOMAIN`）。
- フロント: `middleware.ts` は Cookie の有無で未ログインを判定するだけです（トークンの検証はしない）。401 は Axios interceptor が「リフレッシュ → リクエスト再送 → 失敗時ログイン画面」で処理し、画面のロール制御は `RoleGuard` が行う。
- **これらの既存フローを壊さない。認証・認可の仕組みを独自実装で増やさない。**

## 認可

- 単純なロール制限は、Controller の `@PreAuthorize("hasRole('…')")`（`@EnableMethodSecurity` 有効）を使う。
- **ロールによって処理そのものが変わる**場合は、Strategy パターン（例: `DashboardService` の `Map<UserRole, DashboardQuery>`）を優先し、ロール分岐の `if` / `switch` を増やさない。
- 所有権・連携に基づくアクセス制御は、既存の `VehicleAccessGuard` を再利用する。**閲覧できないリソースは存在を隠すため 404**、閲覧できるが編集権限がない場合は 403 とする（この設計を維持する）。
- 整備記録の編集・削除は作成者本人のみです。

## Customer / Shop

- SHOP の**顧客**は、専用テーブルではなく「そのSHOPと `vehicle_shop_links` が `APPROVED` の車両を持つ OWNER」です。連携は**車両単位**（未連携は `vehicle_shop_links` に行がない状態）。連携済みの SHOP だけが、その顧客車両の閲覧・整備記録の作成ができる。
- 連携は**招待コード**で行います。SHOP が `shop_invite_codes` にコードを発行（有効期限あり、再発行で旧コードは失効）し、OWNER が車両ごとに入力して連携する。**この既存フローを独自方式に置き換えない。**

---

# 9. ドキュメントと Git のルール

## ドキュメントの同期

- API を変更したら、`docs/api/openapi.yaml`（と必要なら `docs/api/bruno/`）を更新する。
- DB を変更したら、Migration・Entity・`docs/db/schema.dbml` を整合させる。
- 利用者向けの説明（デモアカウント・ライセンス等）は `README.md` に書き、このファイルに重複して書かない。

## Git

- commit / push / merge、ブランチの作成・削除は、ユーザーの指示があるまで行わない。
- コミットメッセージは `prefix: 日本語の1行`（`feat` / `fix` / `refactor` / `test` / `docs` / `chore` / `ci`）。
- ブランチ名は `feature|fix|chore|docs/{Issue番号}-{名前}`。`develop` への PR → `main`。
