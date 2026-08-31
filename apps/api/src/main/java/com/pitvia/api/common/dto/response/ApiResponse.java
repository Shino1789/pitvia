package com.pitvia.api.common.dto.response;

/**
 * 正常系レスポンス
 *
 * @param <T> データ型
 *
 * @author pitvia
 * @version 1.0
 */
public record ApiResponse<T>(

        /**
         * メタ情報
         */
        Meta meta,

        /**
         * レスポンスデータ
         */
        T data) {
}
