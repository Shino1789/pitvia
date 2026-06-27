package com.pitvia.api.auth.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.pitvia.api.auth.constant.JwtClaims;
import com.pitvia.api.auth.constant.TokenType;
import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.auth.exception.InvalidJwtException;
import com.pitvia.api.auth.model.RefreshTokenResult;
import com.pitvia.api.auth.properties.JwtProperties;
import com.pitvia.api.user.entity.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
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
        // 設定値の秘密鍵をJJWTで利用可能な形式へ変換
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtProperties.secretKey()));
    }

    /**
     * アクセストークン (JWT) 生成
     *
     * @param user ユーザーエンティティ
     *
     * @return JWT
     */
    public String generateAccessToken(User user) {

        Instant now = Instant.now();
        Instant expireAt = now.plus(accessExpiration);

        return Jwts.builder()
                .subject(user.getId().toString())
                .claim(JwtClaims.ROLE, user.getRole().name())
                .claim(JwtClaims.TOKEN_TYPE, TokenType.ACCESS.value())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expireAt))
                .signWith(signingKey)
                .compact();
    }

    /**
     * リフレッシュトークン生成
     *
     * @param user ユーザーエンティティ
     * @return リフレッシュトークン
     */
    public RefreshTokenResult generateRefreshToken(User user) {

        UUID jti = UUID.randomUUID();
        Instant now = Instant.now();
        Instant expiresAt = now.plus(refreshExpiration);

        String token = Jwts.builder()
                .id(jti.toString())
                .subject(user.getId().toString())
                .claim(JwtClaims.TOKEN_TYPE, TokenType.REFRESH.value())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(signingKey)
                .compact();

        return new RefreshTokenResult(token, jti, expiresAt);
    }

    /**
     * ユーザーID取得
     *
     * @param claims JWTのペイロード（クレーム情報）
     *
     * @return ユーザーID
     */
    public UUID extractUserId(Claims claims) {
        return UUID.fromString(claims.getSubject());
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
     * トークンタイプ取得
     *
     * @param claims JWTのペイロード（クレーム情報）
     *
     * @return トークンタイプ
     * @throws InvalidJwtException クレーム内のトークンタイプ文字列がEnumに変換できない場合
     */
    public TokenType extractTokenType(Claims claims) {
        String value = claims.get(JwtClaims.TOKEN_TYPE, String.class);

        if (value == null || value.isBlank()) {
            throw new InvalidJwtException();
        }

        return TokenType.from(value);
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
     * JWTの署名検証を行い、Claimsを取得する
     *
     * @param token JWT
     *
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
