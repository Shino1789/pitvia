package com.pitvia.api.storage.constant;

/**
 * ストレージプロバイダー種別
 *
 * @author pitvia
 * @version 1.0
 */
public enum StorageProviderType {

    /**
     * ローカル開発環境用オブジェクトストレージ（MinIO）
     */
    MINIO,

    /**
     * 本番環境用オブジェクトストレージ（AWS S3）
     */
    S3

}
