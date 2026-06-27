package com.pitvia.api.auth.model;

import java.util.UUID;
import com.pitvia.api.auth.constant.UserRole;

/**
 * ログイン認証処理結果
 *
 * @author pitvia
 * @version 1.0
 */
public record LoginResult(

        /**
         * ユーザーID
         */
        UUID userId,

        /**
         * ユーザー名
         */
        String userName,

        /**
         * ユーザー権限
         */
        UserRole role,

        /**
         * アクセストークン（JWT）
         */
        String accessToken,

        /**
         * リフレッシュトークン
         */
        String refreshToken) {
}
