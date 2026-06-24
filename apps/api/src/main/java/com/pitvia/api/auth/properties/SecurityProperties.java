package com.pitvia.api.auth.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

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
        boolean swaggerEnabled) {
}
