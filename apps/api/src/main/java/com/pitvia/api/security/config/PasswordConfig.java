package com.pitvia.api.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * パスワード暗号化設定クラス。
 *
 * @author pitvia
 * @version 1.0
 */
@Configuration
public class PasswordConfig {

    /**
     * パスワードエンコーダーをBean登録する。
     *
     * <p>
     * BCryptのデフォルト強度(10)を使用する。
     * </p>
     *
     * @return PasswordEncoder
     */
    @Bean
    PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }

}
