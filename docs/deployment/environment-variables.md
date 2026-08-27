# Environment Variables (β版本番環境)

Pitvia のβ版デプロイに向けた、環境変数・Secretsの管理方針をまとめたドキュメント。

対象は AWS（ECS/Fargate + RDS + S3）と Vercel。AWSリソースの作成・実際のSecrets値の発行は対象外で、
「本番構築時にどこへ何を設定すべきか」を明確にすることが目的。

---

# 結論

- **`.env.prod`（実際の値を含むファイル）はリポジトリに作成しない。**
  ECS は Secrets Manager / SSM Parameter Store から Task Definition 経由で値を注入し、
  Vercel は Project の Environment Variables 画面で値を管理する運用のため、
  本番の実値をファイルとして永続化する必要がない（むしろGit管理下に秘密情報を置くリスクを増やすだけになる）。
  これは既存の `.gitignore`（`.env*` を除外し `.env.example` のみ許可）の方針とも一貫する。
- 代わりに、本ドキュメントで環境変数を一覧化し、本番構築時にAWS/Vercelの管理画面へ何を設定すべきかを整理する。

---

# バックエンド（apps/api）環境変数一覧

`application.yaml` / `application-dev.yaml` / `application-prod.yaml` から実際に参照されている環境変数。

| 変数                      | 機密性                       | ローカル開発（.env.dev）       | β版本番                                                                                                   | 管理先（本番構築時）                                                                 |
| ------------------------- | ---------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `SPRING_PROFILES_ACTIVE`  | 非機密                       | `dev`                          | `prod`                                                                                                    | ECS Task Definition `environment`                                                    |
| `SERVER_PORT`             | 非機密                       | `8080`                         | コンテナ内部ポート（例: `8080`）                                                                          | ECS Task Definition `environment`                                                    |
| `FRONTEND_URL`            | 非機密（環境依存）           | `http://localhost:3000`        | Vercel本番ドメイン（例: `https://pitvia.vercel.app`）                                                     | ECS Task Definition `environment`                                                    |
| `JWT_SECRET_KEY`          | **機密**                     | 開発用サンプル値               | 本番専用に新規生成した値                                                                                  | **Secrets Manager**                                                                  |
| `JWT_EXPIRES`             | 非機密                       | `15m`                          | `15m`（変更不要）                                                                                         | ECS Task Definition `environment`                                                    |
| `JWT_REFRESH_EXPIRES`     | 非機密                       | `7d`                           | `7d`（変更不要）                                                                                          | ECS Task Definition `environment`                                                    |
| `DB_HOST`                 | 非機密（内部エンドポイント） | `db`（コンテナ名）             | RDSエンドポイント                                                                                         | SSM Parameter Store（String）                                                        |
| `DB_PORT`                 | 非機密                       | `5432`                         | `5432`                                                                                                    | SSM Parameter Store（String）                                                        |
| `DB_NAME`                 | 非機密                       | `pitvia`                       | 本番DB名                                                                                                  | SSM Parameter Store（String）                                                        |
| `DB_USERNAME`             | 非機密                       | `pitvia`                       | 本番DBユーザー名                                                                                          | SSM Parameter Store（String）                                                        |
| `DB_PASSWORD`             | **機密**                     | `pitvia`                       | 本番専用に新規生成した値                                                                                  | **Secrets Manager**（RDSの「マスター認証情報の自動管理」機能を利用するのが望ましい） |
| `STORAGE_PROVIDER`        | 非機密                       | `minio`                        | `s3`                                                                                                      | ECS Task Definition `environment`                                                    |
| `STORAGE_ENDPOINT`        | 非機密（dev専用）            | `http://minio:9000`            | **未設定でよい**（S3利用時は空。`S3ClientConfig`はS3の場合エンドポイント上書きを行わない）                | ―                                                                                    |
| `STORAGE_PUBLIC_BASE_URL` | 非機密                       | `http://localhost:9000/pitvia` | 本番S3バケットの公開URL（将来CloudFront化する場合はそのドメイン）                                         | ECS Task Definition `environment`                                                    |
| `STORAGE_ACCESS_KEY`      | 機密（dev専用）              | `minioadmin`                   | **未設定でよい**（本番はECS Task RoleによるIAM Role運用のため不要。`S3ClientConfig`のS3分岐は参照しない） | ―                                                                                    |
| `STORAGE_SECRET_KEY`      | 機密（dev専用）              | `minioadmin`                   | **未設定でよい**（同上）                                                                                  | ―                                                                                    |
| `STORAGE_BUCKET`          | 非機密                       | `pitvia`                       | 本番バケット名                                                                                            | SSM Parameter Store（String）                                                        |
| `STORAGE_REGION`          | 非機密                       | `us-east-1`                    | 本番リージョン（例: `ap-northeast-1`）                                                                    | SSM Parameter Store（String）                                                        |
| `DEBUG`                   | 非機密                       | `false`                        | 未使用（コード上での参照箇所なし。`.env.example`のみに存在する項目のため、そのままでも実害はない）        | ―                                                                                    |

**S3移行のポイント**: `STORAGE_PROVIDER=s3` に切り替えると、`S3ClientConfig`（`storage/config/S3ClientConfig.java`）は
`DefaultCredentialsProvider` を使うため、`STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY` は本番では発行不要。
ECS Task Role に対象S3バケットへの最小権限（`GetObject` / `PutObject` / `DeleteObject`）を付与するだけで済む。

---

# フロントエンド（apps/web）環境変数一覧

| 変数                  | 機密性                                    | ローカル開発                   | β版本番                                             | 管理先                                      |
| --------------------- | ----------------------------------------- | ------------------------------ | --------------------------------------------------- | ------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | 非機密（※クライアントに露出する前提の値） | `http://localhost:8080/api/v1` | 本番APIのベースURL（ALBまたはカスタムドメイン配下） | **Vercel Project の Environment Variables** |

`NEXT_PUBLIC_*` プレフィックスの変数はビルド時にクライアントバンドルへ埋め込まれるため、
そもそも「クライアントに見えて構わない値」しか置いてはならない。現状この1変数のみで、機密情報は含まれていない。

---

# 管理先ごとの整理

## AWS Secrets Manager に保存するもの

- `JWT_SECRET_KEY`
- `DB_PASSWORD`（RDSの「Secrets Managerでのマスター認証情報管理」機能を有効化し、自動生成・自動ローテーションに委ねるのが望ましい）

## SSM Parameter Store（Standard, 無料枠）で管理できるもの

- `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USERNAME`
- `STORAGE_BUCKET` / `STORAGE_REGION`

非機密だが環境ごとに値が変わるものはParameter Storeに集約し、Secrets Managerは真に機密性の高い値のみに絞ることで
コスト（Secrets Managerは1シークレットあたり $0.40/月）を抑える。

## ECS Task Definition の `environment`（平文）でよいもの

- `SPRING_PROFILES_ACTIVE` / `SERVER_PORT`
- `FRONTEND_URL`
- `JWT_EXPIRES` / `JWT_REFRESH_EXPIRES`
- `STORAGE_PROVIDER` / `STORAGE_PUBLIC_BASE_URL`

## Vercel Environment Variables で設定するもの

- `NEXT_PUBLIC_API_URL`（Production環境用の値として設定。Preview環境用に別値を設定するかは、
  本番APIをPreviewから叩かせるかどうかの運用判断による）

---

# 本番では設定しない（発行不要）もの

- `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY`: 本番はIAM Role運用のため未設定でよい
- `STORAGE_ENDPOINT`: S3利用時はSDKのデフォルトエンドポイントが使われるため未設定でよい

---

# 本番構築時（AWS/VercelのGUI操作）にやること チェックリスト

- [ ] `JWT_SECRET_KEY` を本番用に新規生成し、Secrets Managerに登録する（開発用の値を絶対に流用しない）
- [ ] RDS作成時に「マスター認証情報をSecrets Managerで自動管理」を有効化する
- [ ] ECS Task Definitionで、上表の非機密変数を `environment` に、機密変数を `secrets`（`valueFrom`でSecrets Manager/Parameter Store参照）に設定する
- [ ] ECS Task Roleに、対象S3バケットへの `GetObject` / `PutObject` / `DeleteObject` のみを許可するIAMポリシーを付与する
- [ ] Vercel Project の Environment Variables に `NEXT_PUBLIC_API_URL`（本番APIのURL）を設定する
- [ ] `FRONTEND_URL`（ECS側）にVercelの本番ドメインを設定し、CORS許可オリジンとして反映されることを確認する
