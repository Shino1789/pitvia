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
            @NotBlank String sameSite,

            /**
             * Domain属性値
             *
             * Frontend/BackendがAPIサブドメイン構成（例: pitviaapp.com / api.pitviaapp.com）の場合に、
             * 上位ドメイン（例: .pitviaapp.com）を指定してCookieを両ホスト間で共有するために使用する。
             * 未設定（null・空文字）の場合はDomain属性を付与せず、host-only Cookieとして発行する
             * （ローカル開発のlocalhost環境ではこちらの挙動を維持する）。
             */
            String domain) {
    }
}
