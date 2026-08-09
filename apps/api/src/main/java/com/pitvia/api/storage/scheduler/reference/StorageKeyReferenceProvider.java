package com.pitvia.api.storage.scheduler.reference;

import java.util.Set;

import com.pitvia.api.storage.constant.ImageType;

/**
 * DB上で参照されているストレージキーを取得するためのインターフェース
 *
 * <p>
 * {@code OrphanFileCleanupScheduler} 専用の抽象化であり、{@code StorageService} からは利用しない。
 * ストレージ上に実在するキーとDB上の参照キーを突き合わせる際に使用する。
 * 画像用途種別（{@link ImageType}）ごとに、参照元エンティティを保有する
 * 各Featureモジュールが実装を提供する。
 * </p>
 *
 * @author pitvia
 * @version 1.0
 */
public interface StorageKeyReferenceProvider {

    /**
     * この実装が対応する画像用途種別を返す
     *
     * @return 対応する画像用途種別
     */
    ImageType supports();

    /**
     * DB上で参照されている全てのストレージキーを取得する
     *
     * @return 参照中のストレージキーの集合
     */
    Set<String> findAllReferencedKeys();

}
