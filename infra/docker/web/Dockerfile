# ==================================================
# Next.js Dockerfile
# 本番環境向けコンテナ定義
# ==================================================

# ==================================================
# Build Stage
# ==================================================
FROM node:22-alpine AS builder

WORKDIR /app

# package.jsonコピー
COPY apps/web/package*.json ./

# 依存ライブラリインストール
RUN npm ci

# ソースコードコピー
COPY apps/web .

# Next.js build実行
RUN npm run build

# ==================================================
# Runtime Stage
# ==================================================
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

# builderステージから必要なファイルコピー
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# ポート公開
EXPOSE 3000

# Next.js起動
CMD ["npm", "run", "start"]
