package com.pitvia.api.auth.handler;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
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
 * 権限不足時(403 Forbidden)のアクセス拒否制御クラス
 *
 * @author pitvia
 * @version 1.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    /**
     * レスポンス生成ファクトリ
     */
    private final ResponseFactory responseFactory;

    /**
     * JSON変換
     */
    private final ObjectMapper objectMapper;

    /**
     * 権限不足時(403 Forbidden)に呼び出されるエントリーポイント
     */
    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException)
            throws IOException, ServletException {

        // ログ出力
        log.warn("Access denied path={} message={}", request.getRequestURI(), accessDeniedException.getMessage());

        // エラーレスポンス作成
        ErrorResponse errorResponse = responseFactory.error(ErrorCode.FORBIDDEN, request);

        // HTTPレスポンス設定
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        // JSON書き込み
        objectMapper.writeValue(response.getWriter(), errorResponse);
    }

}
