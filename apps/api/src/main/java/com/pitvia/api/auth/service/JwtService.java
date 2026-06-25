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
import com.pitvia.api.auth.properties.JwtProperties;

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
     * アクセストークン生成
     *
     * @param userId ユーザーID
     * @param role   ユーザーロール
     *
     * @return JWT
     */
    public String generateAccessToken(UUID userId, UserRole role) {
        return generateToken(userId, role, accessExpiration);
    }

    /**
     * リフレッシュトークン生成
     *
     * @param userId ユーザーID
     *
     * @return JWT
     */
    public String generateRefreshToken(UUID userId) {
        return generateRefreshTokenInternal(userId, refreshExpiration);
    }

    /**
     * JWT生成
     *
     * @param userId     ユーザーID
     * @param role       ユーザーロール
     * @param expiration 有効期限
     *
     * @return JWT
     */
    private String generateToken(UUID userId, UserRole role, Duration expiration) {
        Instant now = Instant.now();
        Instant expireAt = now.plus(expiration);
        // jtiを生成
        UUID jti = UUID.randomUUID();

        return Jwts.builder()
                .id(jti.toString())
                .subject(userId.toString())
                .claim(JwtClaims.ROLE, role.name())
                .claim(JwtClaims.TOKEN_TYPE, TokenType.ACCESS.value())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expireAt))
                .signWith(signingKey)
                .compact();
    }

    /**
     * リフレッシュトークン生成
     *
     * @param userId     ユーザーID
     * @param expiration 有効期限
     *
     * @return リフレッシュトークン
     */
    private String generateRefreshTokenInternal(UUID userId, Duration expiration) {
        Instant now = Instant.now();
        Instant expireAt = now.plus(expiration);
        // jtiを生成
        String jti = UUID.randomUUID().toString();

        return Jwts.builder()
                .id(jti)
                .subject(userId.toString())
                .claim(JwtClaims.TOKEN_TYPE, TokenType.REFRESH.value())
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
     * jti取得
     *
     * @param claims JWTのペイロード（クレーム情報）
     *
     * @return JWT ID
     */
    public UUID extractJti(Claims claims) {
        return UUID.fromString(claims.getId());
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
