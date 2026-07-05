package com.pitvia.api.auth.model;

import com.pitvia.api.user.entity.User;

/**
 * ログイン認証処理結果
 *
 * @author pitvia
 * @version 1.0
 */
public record LoginResult(

        /**
         * ログインユーザー
         */
        User user,

        /**
         * アクセストークン（JWT）
         */
        String accessToken,

        /**
         * リフレッシュトークン
         */
        String refreshToken) {
}
