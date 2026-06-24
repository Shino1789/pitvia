package com.pitvia.api.auth.filter;

import java.io.IOException;
import java.util.Collection;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.pitvia.api.auth.constant.TokenType;
import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.auth.exception.InvalidJwtException;
import com.pitvia.api.auth.principal.JwtPrincipal;
import com.pitvia.api.auth.service.JwtService;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * リクエストごとのJWT認証を担当するフィルタークラス
 *
 * <p>
 * Authorizationヘッダーからアクセストークンを抽出し、署名および有効期限の検証を行う。
 * トークンが有効な場合、トークンに含まれるクレーム（ユーザーID、ロール）から認証オブジェクトを生成し、
 * Spring Securityのコンテキストに設定する。
 * </p>
 *
 * @author pitvia
 * @version 1.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    /**
     * Authorizationヘッダーのプレフィックス
     */
    private static final String BEARER_PREFIX = "Bearer ";

    /**
     * JWT操作サービス
     */
    private final JwtService jwtService;

    /**
     * JWT認証フィルター
     *
     * @param request     HTTPリクエスト
     * @param response    HTTPレスポンス
     * @param filterChain フィルターチェーン
     * @throws ServletException サーブレット例外が発生した場合
     * @throws IOException      I/O例外が発生した場合
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 認証済みの場合は処理を終了
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // AuthorizationヘッダーからBearerトークンを抽出
            String token = extractToken(request);

            // トークンが存在する場合のみ認証処理を行う
            if (StringUtils.hasText(token)) {

                // JWTの署名検証・有効期限チェックを行いClaimsを取得
                Claims claims = jwtService.parseClaims(token);

                // トークンタイプチェック
                TokenType tokenType = jwtService.extractTokenType(claims);

                // AccessToken以外は検証しない
                if (tokenType != TokenType.ACCESS) {
                    throw new InvalidJwtException();
                }

                // Claimsからユーザー情報を取得
                Long userId = jwtService.extractUserId(claims);
                UserRole role = jwtService.extractRole(claims);

                // JwtPrincipalを生成（ログインユーザー情報）
                JwtPrincipal principal = new JwtPrincipal(userId, role);

                // ロールからAuthorityを生成
                Collection<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(role.getAuthority()));

                // Authenticationを生成
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        principal, // ユーザー情報
                        null, // パスワードなどは不要なため
                        authorities // 権限情報
                );

                // リクエスト詳細(IPなど)を付与
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // SpringのSecurityContextに設定
                SecurityContextHolder.getContext().setAuthentication(authentication);

                // デバッグ用ログ
                log.trace("Authenticated userId={}, role={}", userId, role);
            }

        } catch (InvalidJwtException ex) {
            // トークンタイプが不正（REFRESHトークンが指定された場合など）
            SecurityContextHolder.clearContext();
            log.debug("Invalid JWT");

        } catch (JwtException ex) {
            // JWTの署名不正・期限切れ・フォーマットエラーなど（JJWT由来の例外）
            SecurityContextHolder.clearContext();
            log.debug("JWT validation failed");

        } catch (Exception ex) {
            // DBダウンや予期せぬシステム例外
            SecurityContextHolder.clearContext();
            log.error("Unexpected exception during JWT authentication", ex);
        }

        // 次のフィルターへ
        filterChain.doFilter(request, response);
    }

    /**
     * AuthorizationヘッダーからBearerトークンを抽出する
     *
     * @param request HTTPリクエスト
     * @return JWT（存在しない場合はnull）
     */
    private String extractToken(HttpServletRequest request) {

        String bearerToken = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length()).trim();
        }

        return null;
    }

}
