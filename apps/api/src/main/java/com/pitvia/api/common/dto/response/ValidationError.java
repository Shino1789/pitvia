package com.pitvia.api.common.dto.response;

/**
 * バリデーションエラー情報
 *
 * @author pitvia
 * @version 1.0
 */
public record ValidationError(

        /**
         * エラーが発生したフィールド名
         */
        String field,

        /**
         * エラー理由
         */
        String reason) {

}
