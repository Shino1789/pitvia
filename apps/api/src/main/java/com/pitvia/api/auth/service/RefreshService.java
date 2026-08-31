package com.pitvia.api.auth.service;

import java.time.Instant;
import java.util.UUID;

import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pitvia.api.auth.constant.TokenType;
import com.pitvia.api.auth.exception.InvalidJwtException;
import com.pitvia.api.auth.model.RefreshResult;
import com.pitvia.api.auth.model.RefreshTokenResult;
import com.pitvia.api.common.exception.BusinessException;
import com.pitvia.api.common.exception.ErrorCode;
import com.pitvia.api.token.entity.RefreshToken;
import com.pitvia.api.token.repository.RefreshTokenRepository;
import com.pitvia.api.user.entity.User;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * トークンリフレッシュサービス
 *
 * @author pitvia
 * @version 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshService {

    /** リフレッシュトークンリポジトリ */
    private final RefreshTokenRepository refreshTokenRepository;

    /** JWT操作サービス */
    private final JwtService jwtService;

    /**
     * リフレッシュトークンを使用してアクセストークンとリフレッシュトークンを再発行する（RTR）
     *
     * @param requestToken クッキーから取得したリフレッシュトークン
     * @param httpRequest  HTTPリクエスト
     * @return リフレッシュ処理結果モデル
     * @throws BusinessException トークンが不正、期限切れ、または存在しない場合（401 Unauthorized）
     */
    @Transactional
    public RefreshResult refresh(String requestToken, HttpServletRequest httpRequest) {

        // クッキーから取得したトークンの存在チェック
        if (requestToken == null || requestToken.isBlank()) {
            log.warn("Refresh requested but refresh token cookie is missing.");
            throw new BusinessException(ErrorCode.NO_REFRESH_TOKEN, HttpStatus.UNAUTHORIZED);
        }

        Claims claims;
        UUID userId;
        UUID jti;
        try {
            // JWTとしての署名検証・有効期限チェック
            claims = jwtService.parseClaims(requestToken);

            // トークンタイプの検証
            if (jwtService.extractTokenType(claims) != TokenType.REFRESH) {
                log.warn("Refresh failed: Token type is not REFRESH");
                throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN, HttpStatus.UNAUTHORIZED);
            }

            // 取り出したペイロードから各クレーム情報を取得
            userId = jwtService.extractUserId(claims);
            jti = jwtService.extractJti(claims);

        } catch (InvalidJwtException ex) {
            log.warn("Refresh failed: JWT structures, signature, or parsing invalid");
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN, HttpStatus.UNAUTHORIZED);
        }

        // リフレッシュトークンからSHA-256ハッシュ値を生成
        String tokenHash = DigestUtils.sha256Hex(requestToken);

        // DBから有効な（失効しておらず、期限内の）トークンのみを検索して失効させる
        RefreshToken oldTokenEntity = refreshTokenRepository
                .findByTokenHashAndJtiAndRevokedAtIsNullAndExpiresAtAfter(tokenHash, jti, Instant.now())
                .orElseThrow(() -> {
                    log.warn("Refresh failed: Token not found in DB (Hash/JTI mismatch), or already revoked/expired.");
                    return new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN, HttpStatus.UNAUTHORIZED);
                });

        // JWTのuserIdとDBレコードのuserIdが一致するか検証
        if (!oldTokenEntity.getUser().getId().equals(userId)) {
            log.warn("Refresh failed: JWT userId does not match DB record. userId={}", userId);
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN, HttpStatus.UNAUTHORIZED);
        }

        // 紐づくユーザーを取得
        User user = oldTokenEntity.getUser();

        // アクセストークン (JWT) の生成
        String newAccessToken = jwtService.generateAccessToken(user);

        // リフレッシュトークンの生成とハッシュ値計算
        RefreshTokenResult newRefreshResult = jwtService.generateRefreshToken(user);
        String newRefreshTokenHash = DigestUtils.sha256Hex(newRefreshResult.token());

        // 古いトークンのローテーション（無効化とlastUsedAt記録）
        oldTokenEntity.revoke();

        // リクエストのメタ情報（User-Agent, IPアドレス）を抽出
        String userAgent = httpRequest.getHeader("User-Agent");
        String ipAddress = httpRequest.getRemoteAddr();

        // リフレッシュトークンエンティティの組み立て
        RefreshToken newTokenEntity = RefreshToken.builder()
                .user(user)
                .jti(newRefreshResult.jti())
                .tokenHash(newRefreshTokenHash)
                .userAgent(userAgent)
                .ipAddress(ipAddress)
                .expiresAt(newRefreshResult.expiresAt())
                .build();

        // データベースへ保存
        refreshTokenRepository.save(newTokenEntity);

        log.info("Token refresh successful. userId={}, newJti={}", user.getId(), newRefreshResult.jti());

        return new RefreshResult(user, newAccessToken, newRefreshResult.token());
    }

}
