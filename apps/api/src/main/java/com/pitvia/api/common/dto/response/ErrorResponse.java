package com.pitvia.api.common.dto.response;

/**
 * 異常系レスポンス
 *
 * @author pitvia
 * @version 1.0
 */
public record ErrorResponse(

        /**
         * メタ情報
         */
        Meta meta,

        /**
         * エラー情報
         */
        ErrorBody error) {
}
