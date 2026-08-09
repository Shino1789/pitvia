package com.pitvia.api.storage.model;

import java.time.Instant;

/**
 * ストレージ上のオブジェクト一覧取得結果を格納するオブジェクト
 *
 * @author pitvia
 * @version 1.0
 */
public record StorageObjectSummary(

        /**
         * ストレージキー
         */
        String key,

        /**
         * 最終更新日時
         */
        Instant lastModified) {
}
