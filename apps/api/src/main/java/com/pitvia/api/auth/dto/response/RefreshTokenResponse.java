package com.pitvia.api.auth.dto.response;

/**
 * トークンリフレッシュ（再発行）時のレスポンスDTO
 * 
 * @author pitvia
 * @version 1.0
 */
public record RefreshTokenResponse(

        /**
         * 新しく発行されたアクセストークン（JWT）
         */
        String accessToken,

        /**
         * 新しく発行されたリフレッシュトークン
         */
        String refreshToken) {
}
