package com.pitvia.api.storage.provider;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.pitvia.api.storage.model.StorageObjectSummary;

/**
 * ストレージ操作を抽象化するインターフェース
 *
 * <p>
 * MinIO（開発環境） / AWS S3（本番環境）を切り替えて利用するための共通処理を定義する。
 * 責務はファイルのアップロード・削除・一覧取得のみとし、バリデーション・ストレージキーの採番・
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

    /**
     * 複数のファイルをまとめて削除する
     *
     * <p>
     * 大量件数の削除（孤児ファイルクリーンアップ等）を想定した一括削除用のAPI。
     * {@link #delete(String)} とは異なり、個別オブジェクトの削除失敗時は例外をスローせず、
     * ログ出力のみ行い残りのキーの削除を継続する。
     * </p>
     *
     * @param keys 削除対象のオブジェクトキー一覧
     */
    void delete(List<String> keys);

    /**
     * 指定したプレフィックス配下のオブジェクト一覧を取得する
     *
     * @param prefix 検索対象のキープレフィックス
     * @return 該当するオブジェクトの一覧（キー・最終更新日時）
     */
    List<StorageObjectSummary> listKeys(String prefix);

}
