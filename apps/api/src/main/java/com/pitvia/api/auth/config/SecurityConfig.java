package com.pitvia.api.auth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.pitvia.api.auth.constant.PublicEndpoints;
import com.pitvia.api.auth.filter.JwtAuthenticationFilter;
import com.pitvia.api.auth.handler.CustomAccessDeniedHandler;
import com.pitvia.api.auth.handler.CustomAuthenticationEntryPoint;
import com.pitvia.api.auth.properties.SecurityProperties;

import lombok.RequiredArgsConstructor;

/**
 * Spring Security設定クラス
 *
 * <p>
 * JWT認証を前提としたステートレス構成
 * </p>
 */
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    /** JWT認証フィルタ */
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    /** 未認証時ハンドラ(401) */
    private final CustomAuthenticationEntryPoint customAuthenticationEntryPoint;

    /** 権限不足時ハンドラ(403) */
    private final CustomAccessDeniedHandler customAccessDeniedHandler;

    /** Security設定プロパティ */
    private final SecurityProperties securityProperties;

    /**
     * Spring Securityのフィルタチェーン設定
     *
     * @param http HttpSecurity
     * @return SecurityFilterChain
     * @throws Exception Security設定例外
     */
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                // CSRF無効(JWTのため不要)
                .csrf(AbstractHttpConfigurer::disable)
                // CORS設定を有効化
                .cors(Customizer.withDefaults())
                // 完全ステートレス
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // 認可設定
                .authorizeHttpRequests(auth -> {

                    // 常時公開パスを指定
                    auth.requestMatchers(PublicEndpoints.PUBLIC_URLS).permitAll();

                    // Swaggerパスの動的登録（開発環境のみ常時公開）
                    if (securityProperties.swaggerEnabled()) {
                        auth.requestMatchers(PublicEndpoints.SWAGGER_URLS).permitAll();
                    }

                    // CORSプリフライト
                    auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();

                    // その他はすべて認証必須
                    auth.anyRequest().authenticated();

                })
                // 例外ハンドリング
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(customAuthenticationEntryPoint)
                        .accessDeniedHandler(customAccessDeniedHandler))
                // JWTフィルタを認証フィルタの前に配置
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
