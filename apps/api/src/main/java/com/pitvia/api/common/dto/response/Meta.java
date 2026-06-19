package com.pitvia.api.common.dto.response;

import java.time.OffsetDateTime;

/**
 * 全レスポンス共通メタ情報
 * 
 * @author pitvia
 * @version 1.0
 */
public record Meta(

        /**
         * リクエストID
         */
        String requestId,

        /**
         * レスポンス生成時刻
         */
        OffsetDateTime timestamp) {
}
