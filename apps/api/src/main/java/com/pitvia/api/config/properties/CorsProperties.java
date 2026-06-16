package com.pitvia.api.config.properties;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * CORS設定プロパティ
 *
 * @author pitvia
 * @version 1.0
 */
@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(

        /**
         * 許可するオリジン一覧
         */
        List<String> allowedOrigins

) {
}
