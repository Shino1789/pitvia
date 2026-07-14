package com.pitvia.api.auth.handler;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pitvia.api.common.exception.ErrorCode;
import com.pitvia.api.common.dto.response.ErrorResponse;
import com.pitvia.api.common.factory.ResponseFactory;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 未認証アクセス時(401 Unauthorized)のアクセス拒否制御クラス
 *
 * @author pitvia
 * @version 1.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    /**
     * レスポンス生成ファクトリ
     */
    private final ResponseFactory responseFactory;

    /**
     * JSON変換
     */
    private final ObjectMapper objectMapper;

    /**
     * 未認証アクセス時(401 Unauthorized)に呼び出されるエントリーポイント
     */
    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException)
            throws IOException, ServletException {

        // ログ出力
        log.warn("Unauthorized access path={} message={}", request.getRequestURI(), authException.getMessage());

        // エラーレスポンス作成
        ErrorResponse errorResponse = responseFactory.error(ErrorCode.UNAUTHORIZED, request);

        // HTTPレスポンス設定
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        // JSON書き込み
        objectMapper.writeValue(response.getWriter(), errorResponse);
    }

}
