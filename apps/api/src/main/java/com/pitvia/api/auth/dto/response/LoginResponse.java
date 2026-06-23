package com.pitvia.api.auth.dto.response;

import com.pitvia.api.auth.constant.UserRole;

/**
 * ログイン成功時のレスポンスDTO
 *
 * @author pitvia
 * @version 1.0
 */
public record LoginResponse(

        /**
         * ユーザーID
         */
        Long userId,

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
