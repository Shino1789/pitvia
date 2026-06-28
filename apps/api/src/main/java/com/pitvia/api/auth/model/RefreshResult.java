package com.pitvia.api.auth.model;

/**
 * トークンリフレッシュ処理結果モデル
 *
 * @author pitvia
 * @version 1.0
 */
public record RefreshResult(

        /**
         * 新しく発行されたアクセストークン
         */
        String accessToken,

        /**
         * 新しく発行されたリフレッシュトークン
         */
        String refreshToken) {
}
