package com.pitvia.api.storage.scheduler;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.pitvia.api.storage.constant.ImageType;
import com.pitvia.api.storage.model.StorageObjectSummary;
import com.pitvia.api.storage.properties.StorageProperties;
import com.pitvia.api.storage.provider.StorageProvider;
import com.pitvia.api.storage.scheduler.reference.StorageKeyReferenceProvider;

import lombok.extern.slf4j.Slf4j;

/**
 * 孤児ファイル（DBから参照されていないストレージオブジェクト）の定期クリーンアップスケジューラ
 *
 * @author pitvia
 * @version 1.0
 */
@Slf4j
@Service
public class OrphanFileCleanupScheduler {

    /** ストレージプロバイダー */
    private final StorageProvider storageProvider;

    /** ストレージ設定プロパティ */
    private final StorageProperties storageProperties;

    /** 画像用途種別とそれに対応する参照キー取得実装をマッピングしたマップ */
    private final Map<ImageType, StorageKeyReferenceProvider> referenceProviderMap;

    /**
     * コンストラクタ
     * Springによってインジェクションされた {@link StorageKeyReferenceProvider} の実装クラスリストから、
     * 対応する画像用途種別（{@link ImageType}）をキーとしたマップを構築する
     *
     * @param storageProvider    ストレージプロバイダー
     * @param storageProperties  ストレージ設定プロパティ
     * @param referenceProviders 参照キー取得実装クラスのリスト
     */
    public OrphanFileCleanupScheduler(
            StorageProvider storageProvider,
            StorageProperties storageProperties,
            List<StorageKeyReferenceProvider> referenceProviders) {

        this.storageProvider = storageProvider;
        this.storageProperties = storageProperties;
        this.referenceProviderMap = referenceProviders.stream()
                .collect(Collectors.toMap(StorageKeyReferenceProvider::supports, Function.identity()));
    }

    /**
     * 孤児ファイルを定期的にクリーンアップする
     *
     * <p>
     * 画像用途種別ごとに処理し、1種別の失敗が他の種別のクリーンアップを止めないようにする。
     * </p>
     */
    @Scheduled(cron = "${app.scheduler.storage-orphan-cleanup-cron}")
    public void cleanup() {

        if (!storageProperties.orphanCleanup().enabled()) {
            log.info("Orphan file cleanup is disabled. Skipping.");
            return;
        }

        for (ImageType imageType : ImageType.values()) {
            try {
                cleanupImageType(imageType);
            } catch (RuntimeException ex) {
                log.error("Orphan file cleanup failed. imageType={}", imageType, ex);
            }
        }
    }

    /**
     * 指定した画像用途種別に対して孤児ファイルのクリーンアップを実行する
     *
     * @param imageType クリーンアップ対象の画像用途種別
     */
    private void cleanupImageType(ImageType imageType) {

        StorageKeyReferenceProvider referenceProvider = referenceProviderMap.get(imageType);

        // 対応する参照キー取得実装が未登録の種別は警告のみ出力してスキップ（他の種別は継続）
        if (referenceProvider == null) {
            log.warn("No StorageKeyReferenceProvider registered for imageType={}. Skipping.", imageType);
            return;
        }

        List<String> orphanKeys = findOrphanKeys(imageType, referenceProvider);

        if (orphanKeys.isEmpty()) {
            log.info("Orphan file cleanup: no orphan files found. imageType={}", imageType);
            return;
        }

        if (storageProperties.orphanCleanup().dryRun()) {
            log.info("Orphan file cleanup [DRY-RUN]. imageType={}, count={}, keys={}",
                    imageType, orphanKeys.size(), orphanKeys);
            return;
        }

        deleteOrphans(imageType, orphanKeys);
    }

    /**
     * ストレージ上のオブジェクトとDB参照キーを突き合わせ、孤児ファイルのキー一覧を抽出する
     *
     * @param imageType         対象の画像用途種別
     * @param referenceProvider 対象種別の参照キー取得実装
     * @return 猶予期間を過ぎ、かつDBのいずれからも参照されていないストレージキーの一覧
     */
    private List<String> findOrphanKeys(ImageType imageType, StorageKeyReferenceProvider referenceProvider) {

        // DB上で参照中のキー一覧を取得
        Set<String> referencedKeys = referenceProvider.findAllReferencedKeys();

        // ストレージ上に実在するオブジェクト一覧を取得
        List<StorageObjectSummary> objects = storageProvider.listKeys(imageType.getKeyPrefix() + "/");

        // 猶予期間より新しいオブジェクトは、アップロード直後でDB未反映の可能性があるため対象外とする
        Instant graceThreshold = Instant.now().minus(storageProperties.orphanCleanup().gracePeriod());

        return objects.stream()
                .filter(object -> object.lastModified().isBefore(graceThreshold))
                .map(StorageObjectSummary::key)
                .filter(key -> !referencedKeys.contains(key))
                .toList();
    }

    /**
     * 孤児ファイルを削除する
     *
     * @param imageType  対象の画像用途種別
     * @param orphanKeys 削除対象のストレージキー一覧
     */
    private void deleteOrphans(ImageType imageType, List<String> orphanKeys) {

        storageProvider.delete(orphanKeys);

        log.info("Orphan file cleanup completed. imageType={}, requested={}", imageType, orphanKeys.size());
    }

}
