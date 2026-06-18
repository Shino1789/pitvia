package com.pitvia.api.common.dto.response;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * エラー詳細
 *
 * @author pitvia
 * @version 1.0
 */
public record ErrorBody(

        /**
         * エラー発生APIパス
         */
        String path,

        /**
         * エラーコード(機械利用)
         */
        String code,

        /**
         * クライアント向けエラーメッセージ
         */
        String message,

        /**
         * バリデーションエラー詳細
         */
        @JsonInclude(JsonInclude.Include.NON_NULL) List<ValidationError> validationErrors) {
}
