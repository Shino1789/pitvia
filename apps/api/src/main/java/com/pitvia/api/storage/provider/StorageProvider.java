package com.pitvia.api.storage.provider;

import org.springframework.web.multipart.MultipartFile;

/**
 * ストレージ操作を抽象化するインターフェース
 *
 * <p>
 * MinIO（開発環境） / AWS S3（本番環境）を切り替えて利用するための共通処理を定義する。
 * 責務はファイルのアップロード・削除のみとし、バリデーション・ストレージキーの採番・
 * 公開URLの組み立ては呼び出し元（{@code StorageService}）が担う。
 * </p>
 *
 * @author pitvia
 * @version 1.0
 */
public interface StorageProvider {

    /**
     * ファイルをアップロードする
     *
     * @param file アップロード対象のファイル
     * @param key  保存先のオブジェクトキー
     */
    void upload(MultipartFile file, String key);

    /**
     * ファイルを削除する
     *
     * @param key 削除対象のオブジェクトキー
     */
    void delete(String key);

}
