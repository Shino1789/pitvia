package com.pitvia.api.storage.provider;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.pitvia.api.common.exception.BusinessException;
import com.pitvia.api.common.exception.ErrorCode;
import com.pitvia.api.storage.model.StorageObjectSummary;
import com.pitvia.api.storage.properties.StorageProperties;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.Delete;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectsRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectsResponse;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ObjectIdentifier;
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

    /** DeleteObjectsRequestで一度に指定できるオブジェクト数の上限（S3の仕様上の上限） */
    private static final int DELETE_BATCH_SIZE = 1000;

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

    @Override
    public void delete(List<String> keys) {

        if (keys.isEmpty()) {
            return;
        }

        // DeleteObjectsRequestは1リクエストあたり最大1000件までのためチャンク分割して削除
        for (int i = 0; i < keys.size(); i += DELETE_BATCH_SIZE) {
            deleteBatch(keys.subList(i, Math.min(i + DELETE_BATCH_SIZE, keys.size())));
        }
    }

    /**
     * DeleteObjectsRequestで1バッチ（最大1000件）分のオブジェクトを削除する
     *
     * <p>
     * バッチ単位のリクエスト自体が失敗した場合、および一部のオブジェクトのみ削除に
     * 失敗した場合のいずれも、例外はスローせずログ出力のみ行う。
     * </p>
     *
     * @param keys 削除対象のオブジェクトキー一覧（最大1000件）
     */
    private void deleteBatch(List<String> keys) {

        try {
            DeleteObjectsResponse response = s3Client.deleteObjects(
                    DeleteObjectsRequest.builder()
                            .bucket(storageProperties.bucket())
                            .delete(Delete.builder()
                                    .objects(keys.stream()
                                            .map(key -> ObjectIdentifier.builder().key(key).build())
                                            .toList())
                                    .build())
                            .build());

            // 個別オブジェクトの削除失敗はログのみ出力し、残りのキーの削除は継続する
            response.errors().forEach(error -> log.error(
                    "Failed to delete storage object. key={}, code={}, message={}",
                    error.key(), error.code(), error.message()));

        } catch (S3Exception ex) {
            // バッチ単位のリクエスト自体が失敗した場合もログのみ出力し、呼び出し元の処理を継続させる
            log.error("Storage batch delete failed. keys={}", keys, ex);
        }
    }

    @Override
    public List<StorageObjectSummary> listKeys(String prefix) {

        try {
            List<StorageObjectSummary> summaries = new ArrayList<>();

            ListObjectsV2Request request = ListObjectsV2Request.builder()
                    .bucket(storageProperties.bucket())
                    .prefix(prefix)
                    .build();

            // Paginatorにより複数ページに跨るオブジェクトも自動で取得
            s3Client.listObjectsV2Paginator(request).contents()
                    .forEach(s3Object -> summaries.add(new StorageObjectSummary(s3Object.key(), s3Object.lastModified())));

            return summaries;
        } catch (S3Exception ex) {
            log.error("Storage list failed. prefix={}", prefix, ex);
            throw new BusinessException(ErrorCode.FILE_LIST_FAILED, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
