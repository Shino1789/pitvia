package com.pitvia.api.auth.factory;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import com.pitvia.api.auth.constant.CookieConstants;
import com.pitvia.api.auth.properties.JwtProperties;
import com.pitvia.api.auth.properties.SecurityProperties;

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
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(CookieConstants.REFRESH_TOKEN, token)
                .httpOnly(true)
                .secure(securityProperties.cookie().secure())
                .sameSite(securityProperties.cookie().sameSite())
                .path("/")
                .maxAge(jwtProperties.refreshExpiration());

        applyDomainIfPresent(builder);

        return builder.build();
    }

    /**
     * リフレッシュトークンCookieを削除するためのクッキーを生成する。
     *
     * @return Max-Ageが0に設定されたResponseCookieオブジェクト
     */
    public ResponseCookie delete() {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(CookieConstants.REFRESH_TOKEN, "") // 値を空にする
                .httpOnly(true)
                .secure(securityProperties.cookie().secure())
                .sameSite(securityProperties.cookie().sameSite())
                .path("/")
                .maxAge(0); // 有効期限を0秒にすることでブラウザに即時削除させる

        // 発行時と異なるDomainを指定すると別のCookieとして扱われ削除されないため、発行時と同条件で付与する
        applyDomainIfPresent(builder);

        return builder.build();
    }

    /**
     * Domainが設定されている場合のみ、CookieビルダーにDomain属性を適用する。
     *
     * 未設定（null・空文字）の場合は何もせず、host-only Cookie（Domain属性なし）のまま発行する。
     * ローカル開発（localhost）ではこの分岐によりDomain属性が付与されない従来通りの挙動を維持する。
     *
     * @param builder 対象のCookieビルダー
     */
    private void applyDomainIfPresent(ResponseCookie.ResponseCookieBuilder builder) {
        String domain = securityProperties.cookie().domain();
        if (domain != null && !domain.isBlank()) {
            builder.domain(domain);
        }
    }

}
