package com.pitvia.api.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.pitvia.api.config.properties.CorsProperties;

import lombok.RequiredArgsConstructor;

/**
 * CORS設定
 *
 * フロントエンドからのリクエストを許可する。
 *
 * @author pitvia
 * @version 1.0
 */
@Configuration
@EnableConfigurationProperties
@RequiredArgsConstructor
public class CorsConfig implements WebMvcConfigurer {

    /**
     * CORS設定プロパティ
     */
    private final CorsProperties corsProperties;

    /**
     * アプリケーション全体に適用するCORS設定を登録する。
     *
     * @param registry CORS設定レジストリ
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {

        registry.addMapping("/**")

                // 許可オリジン
                .allowedOriginPatterns(
                        corsProperties.allowedOrigins().toArray(new String[0]))

                // HTTPメソッド
                .allowedMethods(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "PATCH",
                        "OPTIONS")

                // ヘッダー
                .allowedHeaders("*")

                // Cookie / Authorization Header
                .allowCredentials(true)

                // preflight cache
                .maxAge(3600);
    }
}
