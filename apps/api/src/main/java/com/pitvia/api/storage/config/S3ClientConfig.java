package com.pitvia.api.storage.config;

import java.net.URI;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.Assert;

import com.pitvia.api.storage.properties.StorageProperties;

import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;
import software.amazon.awssdk.services.s3.S3Configuration;

/**
 * S3Client設定
 *
 * <p>
 * MinIO（開発環境） / AWS S3（本番環境）共通で利用する {@link S3Client} を生成する。
 * MinIO利用時は固定のアクセスキー・シークレットキーおよびエンドポイントの上書きを行い、
 * AWS S3利用時は {@link DefaultCredentialsProvider} により IAM Role等を自動利用する。
 * </p>
 *
 * @author pitvia
 * @version 1.0
 */
@Configuration
@RequiredArgsConstructor
public class S3ClientConfig {

    /** ストレージ設定プロパティ */
    private final StorageProperties storageProperties;

    /**
     * S3ClientをBean登録する
     *
     * @return S3Client
     */
    @Bean
    S3Client s3Client() {

        S3ClientBuilder builder = S3Client.builder()
                .region(Region.of(storageProperties.region()))
                .serviceConfiguration(
                        S3Configuration.builder()
                                .pathStyleAccessEnabled(storageProperties.pathStyleAccess())
                                .build());

        // STORAGE_PROVIDER環境変数の値に応じて、認証情報の設定方法を切り替える
        switch (storageProperties.provider()) {

            case MINIO -> configureForMinio(builder);

            // AWS本番では IAM Role / ECS Task Role / EC2 Role 等を自動利用
            case S3 -> builder.credentialsProvider(DefaultCredentialsProvider.builder().build());

        }

        return builder.build();
    }

    /**
     * MinIO接続用に認証情報とエンドポイントの上書きを設定する
     *
     * @param builder S3ClientBuilder
     */
    private void configureForMinio(S3ClientBuilder builder) {

        // 開発環境では設定漏れを起動時に検知
        Assert.hasText(storageProperties.accessKey(), "app.storage.access-key is required when provider=minio");
        Assert.hasText(storageProperties.secretKey(), "app.storage.secret-key is required when provider=minio");
        Assert.hasText(storageProperties.endpoint(), "app.storage.endpoint is required when provider=minio");

        builder.credentialsProvider(
                StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(
                                storageProperties.accessKey(),
                                storageProperties.secretKey())))
                .endpointOverride(URI.create(storageProperties.endpoint()));
    }

}
