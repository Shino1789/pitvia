package com.pitvia.api.auth.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Security設定プロパティ
 *
 * @author pitvia
 * @version 1.0
 */
@ConfigurationProperties(prefix = "app.security")
public record SecurityProperties(

        /**
         * Swagger公開可否
         */
        boolean swaggerEnabled,

        /**
         * Cookie設定
         */
        @NotNull Cookie cookie) {
    /**
     * クッキー固有の設定プロパティ
     */
    public record Cookie(

            /**
             * Secure属性の有効可否
             */
            boolean secure,

            /**
             * SameSite属性値 (Lax, None, Strict)
             */
            @NotBlank String sameSite) {
    }
}
