package com.pitvia.api.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * トークンリフレッシュリクエストDTO
 *
 * @author pitvia
 * @version 1.0
 */
public record RefreshTokenRequest(

        /**
         * リフレッシュトークン
         */
        @NotBlank(message = "{validation.auth.refreshToken.required}")
        @Size(max = 2048, message = "{validation.auth.refreshToken.size.max}")
        String refreshToken) {
}
