# Pitvia

**走るクルマのための整備記録・ショップ連携アプリ**

Pitvia は、スポーツカー・旧車・カスタムカーオーナー向けに、
整備履歴・ショップ連携を一元管理できる Web アプリケーションです。

一般的な整備記録アプリが「日常メンテナンス管理」を主軸とする中、
Pitvia は **走る楽しさ・維持する楽しさ・育てる楽しさ** にフォーカスしたサービスを目指します。

---

# 開発背景

既存の整備管理は、以下のような課題があります。

- 整備履歴が紙・Excel・口頭で管理されている
- オーナーとショップで履歴共有しづらい
- カスタム履歴が残らない
- 維持費が見えづらい

また、スポーツカー・旧車オーナーには、

- 一般車と異なる交換サイクル
- チューニング履歴管理
- 弱点部位の予防整備
- 専門ショップとの継続的な関係

といった独自ニーズがあります。

Pitvia は、そうしたユーザー向けに設計されたサービスです。

---

# コンセプト

> 走るクルマの整備手帳

整備記録だけではなく、

- 愛車を育てる履歴
- 走行後のコンディション管理
- カスタム進化の記録
- 信頼できるショップとの継続連携

を提供します。

---

# 想定ユーザー

## オーナー（一般ユーザー）

- スポーツカーオーナー
- 旧車オーナー
- サーキット走行ユーザー
- カスタムカーオーナー

## ショップ（事業者・店舗）

- 整備工場
- チューニングショップ
- 板金塗装ショップ
- ECUセッティングショップ
- モータースポーツ系ショップ

---

# 主な機能

## 1. アカウント機能

- 新規登録 / ログイン
- ロール権限管理

### 権限種別

- 一般ユーザー（OWNER）
- 事業者・店舗（SHOP）

---

## 2. 車両管理

- 複数台登録対応
- メーカー
- 車種
- 型式
- 年式
- ミッション種別
- 駆動方式
- メモ

---

## 3. 整備・カスタム履歴管理

- 作業日
- 走行距離
- 作業内容
- 工賃
- 交換(追加)部品
- 部品代
- 合計金額
- 作業ショップ
- 写真添付
- メモ

---

## 4. コスト管理

- 月別維持費
- 年別維持費
- 修理費集計
- カスタム費集計

---

## 5. ショップ連携

車両単位でオーナーとショップを連携し、
整備履歴を双方で共有できます。

---

## 今後実装予定

- LINE通知連携
- 車検証OCR読み取り
- 故障傾向分析
- 整備ショップ検索機能
- レビュー機能
- 中古車売却時の整備履歴証明

---

# Pitvia の差別化ポイント

一般的な整備管理アプリとの違いとして、以下を重視します。

## 一般向け整備アプリ

- 日常メンテナンス
- 車検管理
- 整備記録保存

## Pitvia

- スポーツカー特化
- 旧車特化
- ショップ連携
- 走るユーザー向け設計

---

# 技術スタック

## Frontend

- TypeScript
- Next.js
- Tailwind CSS

## Backend

- Java
- Spring Boot
- Spring Security
- Spring Data JPA

## Database

- PostgreSQL

## Infrastructure

- AWS
- Vercel
- Docker
- Docker Compose

## 開発ツール

- Git / GitHub
- VS Code
- DBeaver
- draw.io (システム構成図)
- dbdiagram.io (ER図)
- Figma (画面モックデザイン)
- Swagger UI
- Bruno

## 生成AI

- ChatGPT (要件整理・設計レビュー)
- Stitch (画面モック生成)
- V0 (UIプロトタイピング)
- Claude Code (実装・バグ調査・セキュリティ調査)

---

## ディレクトリ構成

```text
pitvia/
    ├── .editorconfig
    ├── .gitattributes
    ├── .gitignore
    ├── .env.dev
    ├── .env.example
    ├── docker-compose.dev.yml
    ├── .github/
    │   ├── pull_request_template.md
    │   └── workflows/
    ├── apps/
    │   ├── web/        # Next.js
    │   ├── api/        # Spring Boot API
    │   └── mobile/     # 将来対応予定
    ├── infra/
    │   └── docker/
    │       ├── api/
    │       │   └── Dockerfile
    │       └── web/
    │           └── Dockerfile
    ├── scripts/
    │   ├── up.sh
    │   ├── down.sh
    │   ├── logs.sh
    │   └── reset.sh
    ├── docs/
    │   ├── architecture/
    │   │   └── architecture.drawio       # draw.ioで作成したアプリ構成図
    │   ├── ui/
    │   │   └── figma-link.md
    │   ├── api/
    │   │   ├── bruno/
    │   │   └── openapi.yaml
    │   ├── db/
    │   │   └── schema.dbml               # dbdiagram.ioで作成したdbml
    │   ├── deployment/
    │   │   └── environment-variables.md  # β版本番環境の環境変数・Secrets管理方針
    │   └── images/
    │       ├── architecture.png
    │       └── er.png
    ├── LICENSE
    ├── CLAUDE.md
    └── README.md
```

※ 詳細設計については docs 配下を参照
