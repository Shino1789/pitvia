package com.pitvia.api.common.dto.response;

import java.util.List;

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
        List<ValidationError> details) {
}
