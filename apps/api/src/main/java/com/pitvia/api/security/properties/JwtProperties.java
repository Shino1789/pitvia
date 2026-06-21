package com.pitvia.api.security.properties;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * JWT設定プロパティ
 *
 * @author pitvia
 * @version 1.0
 */
@ConfigurationProperties(prefix = "jwt")
@Validated
public record JwtProperties(

        /**
         * 秘密鍵
         */
        @NotBlank String secretKey,

        /**
         * アクセストークンの有効期限
         */
        @NotNull Duration expiration,

        /**
         * リフレッシュトークンの有効期限
         */
        @NotNull Duration refreshExpiration

) {
}
