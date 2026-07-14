package com.pitvia.api.auth.model;

import java.time.Instant;
import java.util.UUID;

/**
 * リフレッシュトークン生成結果を格納するオブジェクト
 *
 * @author pitvia
 * @version 1.0
 */
public record RefreshTokenResult(

        /**
         * 生のリフレッシュトークン（JWT文字列）
         */
        String token,

        /**
         * JWT ID
         */
        UUID jti,

        /**
         * トークンの有効期限
         */
        Instant expiresAt) {
}
