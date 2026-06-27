package com.pitvia.api.auth.factory;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import com.pitvia.api.auth.properties.JwtProperties;
import com.pitvia.api.auth.properties.SecurityProperties;
import com.pitvia.api.common.constant.ApiPaths;

import lombok.RequiredArgsConstructor;

/**
 * リフレッシュトークン用のCookie生成ファクトリ
 *
 * @author pitvia
 * @version 1.0
 */
@Component
@RequiredArgsConstructor
public class RefreshTokenCookieFactory {

    /** JWT設定プロパティ */
    private final JwtProperties jwtProperties;

    /** Security設定プロパティ */
    private final SecurityProperties securityProperties;

    /**
     * リフレッシュトークンを格納したHttpOnlyクッキーを生成する。
     *
     * @param token リフレッシュトークン
     * @return ResponseCookieオブジェクト
     */
    public ResponseCookie create(String token) {
        return ResponseCookie.from("refresh_token", token)
                .httpOnly(true)
                .secure(securityProperties.cookie().secure())
                .sameSite(securityProperties.cookie().sameSite())
                .path(ApiPaths.BASE_PATH + ApiPaths.AUTH)
                .maxAge(jwtProperties.refreshExpiration())
                .build();
    }

}
