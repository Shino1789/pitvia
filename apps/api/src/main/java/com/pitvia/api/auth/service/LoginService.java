package com.pitvia.api.auth.service;

import java.util.Locale;

import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pitvia.api.auth.details.CustomUserDetails;
import com.pitvia.api.auth.dto.request.LoginRequest;
import com.pitvia.api.auth.model.LoginResult;
import com.pitvia.api.auth.model.RefreshTokenResult;
import com.pitvia.api.common.exception.BusinessException;
import com.pitvia.api.common.exception.ErrorCode;
import com.pitvia.api.token.entity.RefreshToken;
import com.pitvia.api.token.repository.RefreshTokenRepository;
import com.pitvia.api.user.entity.User;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * ログインサービス
 *
 * @author pitvia
 * @version 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LoginService {

    /** 認証マネージャー */
    private final AuthenticationManager authenticationManager;

    /** リフレッシュトークンリポジトリ */
    private final RefreshTokenRepository refreshTokenRepository;

    /** JWT操作サービス */
    private final JwtService jwtService;

    /**
     * ログイン認証処理
     *
     * @param request     ログインリクエスト情報
     * @param httpRequest HTTPリクエスト
     * @return ログイン処理結果モデル
     * @throws BusinessException 認証情報に誤りがある場合
     */
    @Transactional
    public LoginResult login(LoginRequest request, HttpServletRequest httpRequest) {

        // メールアドレスの正規化
        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);
        log.info("Login attempt started. email={}", normalizedEmail);

        Authentication authentication;
        try {
            // 認証処理実行
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.password()));
        } catch (BadCredentialsException ex) {
            log.warn("Login failed: Bad credentials. email={}", normalizedEmail);
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        // 認証オブジェクトからCustomUserDetailsを取得し、内包されているUserエンティティを取得
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userDetails.getUser();

        // アクセストークン (JWT) の生成
        String accessToken = jwtService.generateAccessToken(user);

        // リフレッシュトークンの生成とハッシュ値計算
        RefreshTokenResult refreshResult = jwtService.generateRefreshToken(user);
        String refreshTokenHash = DigestUtils.sha256Hex(refreshResult.token());

        // リクエストのメタ情報（User-Agent, IPアドレス）を抽出
        String userAgent = httpRequest.getHeader("User-Agent");
        String ipAddress = httpRequest.getRemoteAddr();

        // リフレッシュトークンエンティティの組み立て
        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .user(user)
                .jti(refreshResult.jti())
                .tokenHash(refreshTokenHash)
                .userAgent(userAgent)
                .ipAddress(ipAddress)
                .expiresAt(refreshResult.expiresAt())
                .build();

        // データベースへ保存
        refreshTokenRepository.save(refreshTokenEntity);

        // 最終ログイン日時を更新（※マネージド状態のため、コミット時に自動でダーティチェックによるUPDATEが走るためsave不要）
        user.updateLastLogin();

        log.info("Login successful. userId={}, jti={}", user.getId(), refreshResult.jti());

        return new LoginResult(
                user.getId(),
                user.getUserName(),
                user.getRole(),
                accessToken,
                refreshResult.token());
    }

}
