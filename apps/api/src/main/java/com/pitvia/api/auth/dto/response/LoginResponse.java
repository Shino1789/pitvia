package com.pitvia.api.auth.dto.response;

import com.pitvia.api.auth.constant.UserRole;
import java.util.UUID;

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
