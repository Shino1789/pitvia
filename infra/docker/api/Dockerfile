# ==================================================
# Spring Boot API Dockerfile
# 本番環境向けコンテナ定義
# ==================================================

# ==================================================
# Build Stage
# ==================================================
FROM gradle:8.14.0-jdk21 AS builder

WORKDIR /app

# APIプロジェクトコピー
COPY apps/api /app

# 実行権限付与
RUN chmod +x gradlew

# Jarビルド
RUN ./gradlew clean bootJar --no-daemon

# ==================================================
# Runtime Stage
# ==================================================
FROM eclipse-temurin:21-jre

WORKDIR /app

# builderステージからjarコピー
COPY --from=builder /app/build/libs/*.jar app.jar

# ポート公開
EXPOSE 8080

# Spring Boot起動
ENTRYPOINT ["java", "-jar", "app.jar"]
