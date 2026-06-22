package com.pitvia.api.auth.service;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.pitvia.api.auth.constant.JwtClaims;
import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.auth.exception.InvalidJwtException;
import com.pitvia.api.auth.properties.JwtProperties;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * JWT生成・検証サービス
 *
 * @author pitvia
 * @version 1.0
 */
@Service
public class JwtService {

    /**
     * アクセストークンの有効期間
     */
    private final Duration accessExpiration;

    /**
     * リフレッシュトークンの有効期間
     */
    private final Duration refreshExpiration;

    /**
     * JWT署名生成・検証に使用する秘密鍵
     */
    private final SecretKey signingKey;

    /**
     * 設定プロパティから有効期間および秘密鍵を読み込み初期化
     *
     * @param jwtProperties JWT設定プロパティ
     */
    public JwtService(JwtProperties jwtProperties) {
        this.accessExpiration = jwtProperties.expiration();
        this.refreshExpiration = jwtProperties.refreshExpiration();
        // JJWTライブラリ専用の「デジタル実印」に鋳造して保存
        this.signingKey = Keys.hmacShaKeyFor(jwtProperties.secretKey().getBytes(StandardCharsets.UTF_8));
    }

    /**
     * アクセストークン生成
     *
     * @param userId ユーザーID
     * @param email  メールアドレス
     * @param role   ユーザーロール
     *
     * @return JWT
     */
    public String generateAccessToken(Long userId, String email, UserRole role) {
        return generateToken(userId, email, role, accessExpiration);
    }

    /**
     * リフレッシュトークン生成
     *
     * @param userId ユーザーID
     * @param email  メールアドレス
     * @param role   ユーザーロール
     *
     * @return JWT
     */
    public String generateRefreshToken(Long userId, String email, UserRole role) {
        return generateToken(userId, email, role, refreshExpiration);
    }

    /**
     * JWT生成
     *
     * @param userId     ユーザーID
     * @param email      メールアドレス
     * @param role       ユーザーロール
     * @param expiration 有効期限
     *
     * @return JWT
     */
    private String generateToken(Long userId, String email, UserRole role, Duration expiration) {
        Instant now = Instant.now();
        Instant expireAt = now.plus(expiration);

        return Jwts.builder()
                .subject(userId.toString())
                .claim(JwtClaims.EMAIL, email)
                .claim(JwtClaims.ROLE, role.name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expireAt))
                .signWith(signingKey)
                .compact();
    }

    /**
     * ユーザーID取得
     *
     * @param claims JWTのペイロード（クレーム情報）
     *
     * @return ユーザーID
     */
    public Long extractUserId(Claims claims) {
        return Long.valueOf(claims.getSubject());
    }

    /**
     * メールアドレス取得
     *
     * @param claims JWTのペイロード（クレーム情報）
     *
     * @return メールアドレス
     */
    public String extractEmail(Claims claims) {
        return claims.get(JwtClaims.EMAIL, String.class);
    }

    /**
     * ロール取得
     *
     * @param claims JWTのペイロード（クレーム情報）
     *
     * @return ユーザーロール
     * @throws InvalidJwtException クレーム内のロール文字列がEnumに変換できない場合
     */
    public UserRole extractRole(Claims claims) {
        try {
            return UserRole.valueOf(claims.get(JwtClaims.ROLE, String.class));
        } catch (IllegalArgumentException | NullPointerException ex) {
            throw new InvalidJwtException(ex);
        }
    }

    /**
     * 有効期限取得
     *
     * @param claims JWTのペイロード（クレーム情報）
     *
     * @return 有効期限
     */
    public Instant extractExpiration(Claims claims) {
        return claims.getExpiration().toInstant();
    }

    /**
     * JWTの署名改ざんおよび有効期限の検証
     *
     * @param token JWT
     *
     * @return true:正常、false:不正または期限切れ
     */
    public boolean validateToken(String token) {

        try {
            return !isTokenExpired(parseClaims(token));
        } catch (InvalidJwtException ex) {
            return false;
        }

    }

    /**
     * トークン期限切れ判定
     *
     * @param claims JWTのペイロード（クレーム情報）
     *
     * @return true:期限切れ
     */
    public boolean isTokenExpired(Claims claims) {
        return extractExpiration(claims).isBefore(Instant.now());
    }

    /**
     * JWTの署名検証を行い、Claimsを取得する
     *
     * @param token JWT
     * @return Claims ペイロードの中身
     * @throws InvalidJwtException 署名検証に失敗、またはトークンが不正な場合
     */
    public Claims parseClaims(String token) {
        try {
            return Jwts.parser().verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException ex) {
            throw new InvalidJwtException(ex);
        }
    }

}
