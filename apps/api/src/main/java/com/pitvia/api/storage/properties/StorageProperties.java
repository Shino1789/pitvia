package com.pitvia.api.storage.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import com.pitvia.api.storage.constant.StorageProviderType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * ストレージ設定プロパティ
 *
 * @author pitvia
 * @version 1.0
 */
@ConfigurationProperties(prefix = "app.storage")
@Validated
public record StorageProperties(

        /**
         * 利用するストレージプロバイダー
         */
        @NotNull StorageProviderType provider,

        /**
         * SDK接続先エンドポイント（MinIO利用時のみ指定。S3利用時は未指定でデフォルトエンドポイントを利用）
         */
        String endpoint,

        /**
         * 公開URLのベースURL（MinIO / S3 / CloudFront等、切替可能）
         *
         * <p>
         * 例）
         * MinIO: {@code http://localhost:9000/pitvia}
         * S3: {@code https://bucket.s3.ap-northeast-1.amazonaws.com}
         * CloudFront: {@code https://cdn.pitvia.com}
         * </p>
         */
        @NotBlank String publicBaseUrl,

        /**
         * アクセスキー
         */
        String accessKey,

        /**
         * シークレットキー
         */
        String secretKey,

        /**
         * バケット名
         */
        @NotBlank String bucket,

        /**
         * リージョン
         */
        @NotBlank String region,

        /**
         * パススタイルアクセスを使用するか（MinIO利用時はtrue）
         */
        boolean pathStyleAccess

) {
}
