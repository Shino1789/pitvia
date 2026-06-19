package com.pitvia.api.common.filter;

import java.io.IOException;
import java.util.UUID;

import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.pitvia.api.common.constant.RequestContextKeys;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * HTTPリクエスト単位のログコンテキストをMDCへ設定するフィルタ
 *
 * @author pitvia
 * @version 1.0
 */
@Order(1)
@Component
public class MdcLoggingFilter extends OncePerRequestFilter {

    /**
     * リクエスト単位で一意なリクエストIDを生成し、
     * リクエスト属性・レスポンスヘッダ・MDCへ設定する。
     *
     * <p>
     * クライアントから {@code X-Request-Id} が渡された場合はその値を利用し、
     * 未指定の場合はサーバー側でUUIDを生成する。
     * </p>
     *
     * @param request     HTTPリクエスト
     * @param response    HTTPレスポンス
     * @param filterChain フィルタチェーン
     * @throws ServletException サーブレット例外
     * @throws IOException      入出力例外
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // 上流からリクエストID取得
        String requestId = request.getHeader(RequestContextKeys.REQUEST_ID_HEADER);

        // なければ生成
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        } else {
            requestId = requestId.trim();
        }

        // API内部で利用するリクエスト属性をセット
        request.setAttribute(RequestContextKeys.REQUEST_ID_ATTRIBUTE, requestId);

        // クライアント・外部システムとのHTTPヘッダにセット
        response.setHeader(RequestContextKeys.REQUEST_ID_HEADER, requestId);

        MDC.put(RequestContextKeys.MDC_REQUEST_ID, requestId);
        MDC.put(RequestContextKeys.MDC_METHOD, request.getMethod());
        MDC.put(RequestContextKeys.MDC_PATH, request.getRequestURI());

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(RequestContextKeys.MDC_REQUEST_ID);
            MDC.remove(RequestContextKeys.MDC_METHOD);
            MDC.remove(RequestContextKeys.MDC_PATH);
        }
    }
}
