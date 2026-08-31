package com.pitvia.api.storage.transaction;

import java.util.UUID;
import java.util.function.Consumer;
import java.util.function.Function;

import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
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
        // 後続処理（DB側の紐付け）が成功した場合のみ、古いファイルの削除をコミット後まで予約する
        scheduleCleanupAfterCommit(oldKey);
        return result;
    }

    /**
     * ストレージキーの削除を、現在アクティブなDBトランザクションのコミット完了後まで遅延させる
     *
     * <p>
     * トランザクションがロールバックされた場合は削除を一切実行しない（DBが参照するキーと
     * ストレージの実体が常に整合した状態を保つ）。呼び出し元がDBトランザクションの外側から
     * 呼ばれた場合（本来想定しない使い方）は、遅延させる先が無いため即座に削除する。
     * </p>
     *
     * @param key 削除対象のストレージキー
     */
    private void scheduleCleanupAfterCommit(String key) {

        if (key == null || key.isBlank()) {
            return;
        }

        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            // トランザクション外からの呼び出しは遅延先が無いため、従来通り即座に削除する
            log.warn("No active transaction found. Deleting file immediately instead of deferring to after-commit. key={}", key);
            cleanupUploadedFile(key);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                // コミットが確定して初めて、DBから参照されなくなった古いファイルを削除する
                cleanupUploadedFile(key);
            }
        });
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
