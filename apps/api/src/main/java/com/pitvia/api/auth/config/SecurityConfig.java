package com.pitvia.api.auth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
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
import com.pitvia.api.common.filter.LoggingFilter;
import com.pitvia.api.common.filter.MdcLoggingFilter;

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

    /** MDCロギングフィルタ */
    private final MdcLoggingFilter mdcLoggingFilter;

    /** ロギングフィルタ */
    private final LoggingFilter loggingFilter;

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
                // フィルター設定
                .addFilterBefore(mdcLoggingFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(loggingFilter, MdcLoggingFilter.class)
                .addFilterAfter(jwtAuthenticationFilter, LoggingFilter.class);

        return http.build();
    }

    /**
     * AuthenticationManagerのBean登録
     *
     * @param configuration 認証設定オブジェクト
     * @return AuthenticationManager 認証マネージャー
     * @throws Exception マネージャーの取得に失敗した場合
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

}
