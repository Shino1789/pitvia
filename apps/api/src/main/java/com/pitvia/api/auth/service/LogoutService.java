package com.pitvia.api.auth.service;

import java.time.Instant;

import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pitvia.api.token.repository.RefreshTokenRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * ログアウトサービス
 *
 * @author pitvia
 * @version 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LogoutService {

    /** リフレッシュトークンリポジトリ */
    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * ログアウト処理を実行し、該当するリフレッシュトークンを無効化する。
     *
     * @param refreshToken 生のリフレッシュトークン
     */
    @Transactional
    public void logout(String refreshToken) {

        // クッキーから取得したトークンの存在チェック
        if (refreshToken == null || refreshToken.isBlank()) {
            log.debug("Logout requested but refresh token cookie is missing.");
            return;
        }

        // リフレッシュトークンからSHA-256ハッシュ値を生成
        String tokenHash = DigestUtils.sha256Hex(refreshToken);

        // DBから有効な（失効しておらず、期限内の）トークンのみを検索して失効させる
        refreshTokenRepository.findByTokenHashAndRevokedAtIsNullAndExpiresAtAfter(tokenHash, Instant.now())
                .ifPresent(tokenEntity -> {
                    tokenEntity.revoke();
                    log.info("Refresh token revoked. userId={}, jti={}",
                            tokenEntity.getUser().getId(),
                            tokenEntity.getJti());
                });
    }

}
