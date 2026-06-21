package com.pitvia.api.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Spring Security設定クラス。
 *
 * <p>
 * JWT認証を前提としたステートレス構成を採用する。
 * </p>
 *
 * <pre>
 * 現時点の認証ポリシー
 * --------------------------------------------------------
 * /health              : 誰でもアクセス可能
 * /auth/**             : 誰でもアクセス可能
 * /swagger-ui/**       : 誰でもアクセス可能
 * /v3/api-docs/**      : 誰でもアクセス可能
 * その他               : 認証必須
 * --------------------------------------------------------
 *
 * 今後追加予定
 * --------------------------------------------------------
 * - JwtAuthenticationFilter
 * - JwtAuthenticationEntryPoint
 * - CustomAccessDeniedHandler
 * - Role権限制御
 * --------------------------------------------------------
 * </pre>
 *
 * @author pitvia
 * @version 1.0
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Spring Securityのフィルタチェーン設定。
     *
     * @param http HttpSecurity
     * @return SecurityFilterChain
     * @throws Exception Security設定例外
     */
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http.csrf(AbstractHttpConfigurer::disable)
                // CorsConfigを利用
                .cors(Customizer.withDefaults())
                // JWT認証のためセッションを無効化
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // 認可設定
                .authorizeHttpRequests(auth -> auth
                        // 認証不要API
                        .requestMatchers("/health", "/auth/**", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        // OPTIONS許可
                        .requestMatchers(HttpMethod.OPTIONS).permitAll()
                        // その他は認証必須
                        .anyRequest()
                        .authenticated())

        /*
         * JWT導入時に追加予定
         */
        // .exceptionHandling(ex -> ex
        //
        // .authenticationEntryPoint(jwtAuthenticationEntryPoint)
        //
        // .accessDeniedHandler(customAccessDeniedHandler))
        //
        // .addFilterBefore(
        // jwtAuthenticationFilter,
        // UsernamePasswordAuthenticationFilter.class)

        ;

        return http.build();
    }

}
