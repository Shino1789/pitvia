# Environment Variables (β版本番環境)

Pitvia のβ版デプロイに向けた、環境変数・Secretsの管理方針をまとめたドキュメント。

対象は AWS（ECS/Fargate + RDS + S3）と Vercel。**2026-08-31時点でAWS CLIの読み取り専用コマンドにより実機と再突合済み**（ECS Task Definition `pitvia-api:2`、ECS Service `pitvia-api-service`、RDS `pitvia-db`、S3 `pitvia-prod-storage`、Secrets Manager、ALB `pitvia-alb`、Route 53 Hosted Zone、ACM証明書）。値は実際に構築された内容を反映しており、「例」ではなく実運用値である。

ECS Serviceは`pitvia-api:2`で`runningCount: 1 / desiredCount: 1`・`rolloutState: COMPLETED`（定常状態）を確認済み。`api.pitviaapp.com`のRoute 53 AレコードはALB（`dualstack.pitvia-alb-1014844849.ap-northeast-1.elb.amazonaws.com`）へのAliasとして設定済み、ACM証明書（`api.pitviaapp.com`）はALBのHTTPS:443リスナーに`InUse: true`でアタッチ済み。

---

# 結論

- **`.env.prod`（実際の値を含むファイル）はリポジトリに作成しない。**
  ECS は Secrets Manager から Task Definition 経由で機密値を注入し、非機密値は Task Definition の `environment` に直接設定する運用のため、
  本番の実値をファイルとして永続化する必要がない（むしろGit管理下に秘密情報を置くリスクを増やすだけになる）。
  これは既存の `.gitignore`（`.env*` を除外し `.env.example` のみ許可）の方針とも一貫する。
- **非機密値の管理先は「SSM Parameter Store」ではなく「ECS Task Definition の `environment`」を正式採用した。** 経緯は後述（[管理先ごとの整理](#管理先ごとの整理)）。
- 独自ドメインは `pitviaapp.com`（Frontend）／`api.pitviaapp.com`（Backend）を採用している。当初 `pitvia.com` を予定していたが、お名前.comでプレミアムドメイン扱いとなり545,512円（税込）が提示されたため取得を断念した経緯がある（詳細はデプロイ道場§9参照）。

---

# バックエンド（apps/api）環境変数一覧

`application.yaml` / `application-dev.yaml` / `application-prod.yaml`（2026-08-30時点の内容で再確認済み）から実際に参照されている環境変数。

| 変数                      | 機密性                       | ローカル開発（.env.dev）       | β版本番（実機の実際の値）                                                                           | 管理先（実機で確認済み）                                                          |
| ------------------------- | ---------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `SPRING_PROFILES_ACTIVE`  | 非機密                       | `dev`                          | `prod`                                                                                              | ECS Task Definition `environment`                                                 |
| `SERVER_PORT`             | 非機密                       | `8080`                         | `8080`                                                                                              | ECS Task Definition `environment`                                                 |
| `FRONTEND_URL`            | 非機密（環境依存）           | `http://localhost:3000`        | `https://pitviaapp.com`                                                                             | ECS Task Definition `environment`                                                 |
| `JWT_SECRET_KEY`          | **機密**                     | 開発用サンプル値               | 本番専用に新規生成した値                                                                            | **Secrets Manager**（`pitvia/prod/jwt-secret-key`）                               |
| `JWT_EXPIRES`             | 非機密                       | `15m`                          | `15m`                                                                                               | ECS Task Definition `environment`                                                 |
| `JWT_REFRESH_EXPIRES`     | 非機密                       | `7d`                           | `7d`                                                                                                | ECS Task Definition `environment`                                                 |
| `DB_HOST`                 | 非機密（内部エンドポイント） | `db`（コンテナ名）             | `pitvia-db.czaagyikoeey.ap-northeast-1.rds.amazonaws.com`                                           | ECS Task Definition `environment`                                                 |
| `DB_PORT`                 | 非機密                       | `5432`                         | `5432`                                                                                              | ECS Task Definition `environment`                                                 |
| `DB_NAME`                 | 非機密                       | `pitvia`                       | `pitvia`                                                                                            | ECS Task Definition `environment`                                                 |
| `DB_USERNAME`             | 非機密                       | `pitvia`                       | `pitvia`                                                                                            | ECS Task Definition `environment`                                                 |
| `DB_PASSWORD`             | **機密**                     | `pitvia`                       | RDSの「マスター認証情報の自動管理」機能で自動生成                                                   | **Secrets Manager**（RDSが自動作成する`rds!db-...`Secret。RDS作成時に有効化済み） |
| `STORAGE_PROVIDER`        | 非機密                       | `minio`                        | `s3`                                                                                                | ECS Task Definition `environment`                                                 |
| `STORAGE_ENDPOINT`        | 非機密（dev専用）            | `http://minio:9000`            | **未設定**（S3利用時は空。`S3ClientConfig`はS3の場合エンドポイント上書きを行わない）                | ―                                                                                 |
| `STORAGE_PUBLIC_BASE_URL` | 非機密                       | `http://localhost:9000/pitvia` | `https://pitvia-prod-storage.s3.ap-northeast-1.amazonaws.com`                                       | ECS Task Definition `environment`                                                 |
| `STORAGE_ACCESS_KEY`      | 機密（dev専用）              | `minioadmin`                   | **未設定**（本番はECS Task RoleによるIAM Role運用のため不要。`S3ClientConfig`のS3分岐は参照しない） | ―                                                                                 |
| `STORAGE_SECRET_KEY`      | 機密（dev専用）              | `minioadmin`                   | **未設定**（同上）                                                                                  | ―                                                                                 |
| `STORAGE_BUCKET`          | 非機密                       | `pitvia`                       | `pitvia-prod-storage`                                                                               | ECS Task Definition `environment`                                                 |
| `STORAGE_REGION`          | 非機密                       | `us-east-1`                    | `ap-northeast-1`                                                                                    | ECS Task Definition `environment`                                                 |
| `DEBUG`                   | 非機密                       | `false`                        | 未使用（コード上での参照箇所なし。`.env.example`のみに存在する項目のため、そのままでも実害はない）  | ―                                                                                 |

上記のうち機密性「非機密」の12変数・機密性「機密」の2変数、計14変数すべてを `aws ecs describe-task-definition --task-definition pitvia-api` で実際に取得し、1件ずつ突合済み（値の一致を確認、Secretは`valueFrom`のARN一致のみ確認し値は取得していない）。

**S3移行のポイント**: `STORAGE_PROVIDER=s3` に切り替えると、`S3ClientConfig`（`storage/config/S3ClientConfig.java`）は
`DefaultCredentialsProvider` を使うため、`STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY` は本番では発行不要。
ECS Task Role（`pitvia-ecs-task-role`）に対象S3バケット（`pitvia-prod-storage`）への最小権限（`GetObject` / `PutObject` / `DeleteObject`）を付与するだけで済む。実機のTask Roleインラインポリシー（`pitvia-s3-access-policy`）でこの3操作・対象バケット限定であることを確認済み。

---

# フロントエンド（apps/web）環境変数一覧

| 変数                  | 機密性                                    | ローカル開発                   | β版本番                                                                | 管理先                                  |
| --------------------- | ----------------------------------------- | ------------------------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| `NEXT_PUBLIC_API_URL` | 非機密（※クライアントに露出する前提の値） | `http://localhost:8080/api/v1` | **予定値**: `https://api.pitviaapp.com/api/v1`（§15 Vercel構築で確定） | Vercel Project の Environment Variables |

> **注記（2026-08-31時点）**: AWS側（Route53 → ALB → ECS/Fargate → RDS）は構築・疎通確認が完了しており、`https://api.pitviaapp.com`は実際に到達可能なAPIドメインとして確定している。一方、Vercel側のプロジェクト作成・環境変数設定（デプロイ道場§15）はVercel CLIで読み取り専用確認した限りまだ未実施（`vercel project ls`でPitvia関連プロジェクトなし、`apps/web/.vercel`のリンクなし）。上記`NEXT_PUBLIC_API_URL`の値自体はAWS側が確定済みのため変更不要だが、「Vercel Projectに設定済みの値」ではなくあくまで「設定すべき予定値」である点に注意。§15完了後、本ドキュメントを実際の設定値で再確認すること。

`NEXT_PUBLIC_*` プレフィックスの変数はビルド時にクライアントバンドルへ埋め込まれるため、
そもそも「クライアントに見えて構わない値」しか置いてはならない。現状この1変数のみで、機密情報は含まれていない。

---

# 管理先ごとの整理

## AWS Secrets Manager に保存するもの（実機確認済み）

- `JWT_SECRET_KEY` → `pitvia/prod/jwt-secret-key`（Secrets Manager、Task Execution Roleの`GetSecretValue`をこのARNのみに限定したインラインポリシーで参照）
- `DB_PASSWORD` → RDSが自動作成した`rds!db-d8a9a94c-...`Secret（RDS作成時に「マスター認証情報をSecrets Managerで自動管理」を有効化済み）

いずれもECS Task Definitionの`secrets`（`valueFrom`）経由で注入されており、`environment`（平文）側にはこの2つのキーが含まれていないことを実機で確認済み。

**注意（重要・revision 1→2で修正した落とし穴）**: 上記2つのSecretは、どちらもSecrets Manager側でキー/値ペア形式（JSON、例: `{"JWT_SECRET_KEY":"..."}` / `{"username":"...","password":"..."}`）で保存されている。そのため、Task Definitionの`secrets[].valueFrom`にARNだけを指定すると、JSON文字列全体がそのまま環境変数の値として渡ってしまい、アプリ側のBase64デコード等が失敗してタスクが起動できない不具合が発生した（`pitvia-api:1`で発生・実機調査済み）。
正しくは、ARNの末尾にJSONキー修飾子（`:キー名::`）を付ける必要がある。現在の`pitvia-api:2`ではこれが反映済みであることを実機で確認済み。
