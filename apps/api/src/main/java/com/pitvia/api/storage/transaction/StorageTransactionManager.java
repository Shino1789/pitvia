package com.pitvia.api.storage.transaction;

import java.util.UUID;
import java.util.function.Consumer;
import java.util.function.Function;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.pitvia.api.storage.constant.ImageType;
import com.pitvia.api.storage.service.StorageService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * ストレージ操作とDBトランザクションを連携・制御するマネージャー
 *
 * @author pitvia
 * @version 1.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StorageTransactionManager {

    /** ストレージサービス */
    private final StorageService storageService;

    /**
     * ファイルをアップロードし、返却値を伴わない後続処理を実行する
     *
     * @param file       アップロード対象ファイル
     * @param imageType  画像種別
     * @param resourceId リソース識別子（ユーザーID、車両ID等）
     * @param operation  ストレージキーを受け取り実行する処理
     */
    public void uploadAndExecute(
            MultipartFile file,
            ImageType imageType,
            UUID resourceId,
            Consumer<String> operation) {

        // ストレージへのファイルアップロード
        String key = storageService.upload(file, imageType, resourceId);
        try {
            // 後続処理の実行
            operation.accept(key);
        } catch (RuntimeException ex) {
            // 例外発生時はアップロードしたファイルを削除してロールバック
            cleanupUploadedFile(key);
            throw ex;
        }
    }

    /**
     * ファイルをアップロードし、返却値を伴う後続処理を実行する
     *
     * @param <T>        処理結果の型
     * @param file       アップロード対象ファイル
     * @param imageType  画像種別
     * @param resourceId リソース識別子（ユーザーID、車両ID等）
     * @param operation  ストレージキーを受け取り結果を返す処理
     * @return 後続処理を実行した結果オブジェクト
     */
    public <T> T uploadAndExecute(
            MultipartFile file,
            ImageType imageType,
            UUID resourceId,
            Function<String, T> operation) {

        // ストレージへのファイルアップロード
        String key = storageService.upload(file, imageType, resourceId);
        try {
            // 後続処理の実行と結果の返却
            return operation.apply(key);
        } catch (RuntimeException ex) {
            // 例外発生時はアップロードしたファイルを削除してロールバック
            cleanupUploadedFile(key);
            throw ex;
        }
    }

    /**
     * ファイルを差し替え、返却値を伴う後続処理を実行する
     *
     * @param <T>        処理結果の型
     * @param file       新規アップロード対象ファイル
     * @param imageType  画像種別
     * @param resourceId リソース識別子（ユーザーID、車両ID等）
     * @param oldKey     削除対象となる古いファイルのストレージキー
     * @param operation  新しいストレージキーを受け取り結果を返す処理
     * @return 後続処理を実行した結果オブジェクト
     */
    public <T> T replaceAndExecute(
            MultipartFile file,
            ImageType imageType,
            UUID resourceId,
            String oldKey,
            Function<String, T> operation) {

        // 新しいファイルのアップロード
        String newKey = storageService.upload(file, imageType, resourceId);

        T result;
        try {
            // 後続処理の実行
            result = operation.apply(newKey);
        } catch (RuntimeException ex) {
            // 例外発生時は新規アップロードしたファイルを削除
            cleanupUploadedFile(newKey);
            throw ex;
        }
        // 後続処理成功時のみ古いファイルを削除
        cleanupUploadedFile(oldKey);
        return result;
    }

    /**
     * アップロードされたファイルを削除する（クリーンアップ用）
     *
     * @param key 削除対象のストレージキー
     */
    private void cleanupUploadedFile(String key) {

        if (key == null || key.isBlank()) {
            return;
        }

        try {
            storageService.delete(key);
        } catch (RuntimeException ex) {
            log.error("Failed to cleanup uploaded file. key={}", key, ex);
        }
    }

}
