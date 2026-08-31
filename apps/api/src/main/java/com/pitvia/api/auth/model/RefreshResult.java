package com.pitvia.api.auth.model;

import com.pitvia.api.user.entity.User;

/**
 * トークンリフレッシュ処理結果モデル
 *
 * @author pitvia
 * @version 1.0
 */
public record RefreshResult(

        /**
         * ユーザー情報
         */
        User user,

        /**
         * 新しく発行されたアクセストークン
         */
        String accessToken,

        /**
         * 新しく発行されたリフレッシュトークン
         */
        String refreshToken) {
}
