package com.pitvia.api.storage.provider;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.pitvia.api.common.exception.BusinessException;
import com.pitvia.api.common.exception.ErrorCode;
import com.pitvia.api.storage.properties.StorageProperties;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

/**
 * S3互換オブジェクトストレージ用プロバイダー
 *
 * <p>
 * MinIO / AWS S3 はいずれもS3 APIに準拠しているため、アップロード・削除処理を共通化できる。
 * どちらに接続するかは {@link S3Client} のBean定義（接続先・認証情報）側で吸収しており、
 * 本クラスはSDK呼び出し以外の環境差異を意識しない。
 * </p>
 *
 * @author pitvia
 * @version 1.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class S3StorageProvider implements StorageProvider {

    /** S3互換API用クライアント */
    private final S3Client s3Client;

    /** ストレージ設定プロパティ */
    private final StorageProperties storageProperties;

    @Override
    public void upload(MultipartFile file, String key) {

        try {
            // 指定キーでオブジェクトをアップロード
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(storageProperties.bucket())
                            .key(key)
                            .contentType(file.getContentType())
                            .cacheControl("public, max-age=31536000, immutable")
                            .build(),
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (IOException | S3Exception ex) {
            // ファイル読み込み失敗、またはSDK呼び出し失敗
            log.error("Storage upload failed. key={}", key, ex);
            throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public void delete(String key) {

        try {
            // 指定キーのオブジェクトを削除
            s3Client.deleteObject(
                    DeleteObjectRequest.builder()
                            .bucket(storageProperties.bucket())
                            .key(key)
                            .build());
        } catch (S3Exception ex) {
            log.error("Storage delete failed. key={}", key, ex);
            throw new BusinessException(ErrorCode.FILE_DELETE_FAILED, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
