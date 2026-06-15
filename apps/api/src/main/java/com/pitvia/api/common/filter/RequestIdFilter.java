package com.pitvia.api.common.filter;

import java.io.IOException;
import java.util.UUID;

import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;

/**
 * リクエスト単位で一意なリクエストIDを付与するフィルタ
 *
 * @author pitvia
 * @version 1.0
 */
@Component
public class RequestIdFilter extends OncePerRequestFilter {

    /**
     * クライアント・外部システムとのHTTPヘッダ名
     */
    public static final String REQUEST_ID_HEADER = "X-Request-Id";

    /**
     * サーバー内部で利用するリクエスト属性キー
     */
    public static final String REQUEST_ID_ATTRIBUTE = "requestId";

    /**
     * リクエストIDをMDCへ格納する際のキー
     */
    public static final String MDC_REQUEST_ID = "requestId";

    /**
     * HTTPメソッドをMDCへ格納する際のキー
     */
    private static final String MDC_METHOD = "method";

    /**
     * リクエストURIをMDCへ格納する際のキー
     */
    private static final String MDC_REQUEST_URI = "requestUri";

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
    protected void doFilterInternal(HttpServletRequest request, jakarta.servlet.http.HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // 上流からリクエストID取得
        String requestId = request.getHeader(REQUEST_ID_HEADER);

        // なければ生成
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        } else {
            requestId = requestId.trim();
        }

        // API内部で利用するリクエスト属性をセット
        request.setAttribute(REQUEST_ID_ATTRIBUTE, requestId);

        // クライアント・外部システムとのHTTPヘッダにセット
        response.setHeader(REQUEST_ID_HEADER, requestId);

        MDC.put(MDC_REQUEST_ID, requestId);
        MDC.put(MDC_METHOD, request.getMethod());
        MDC.put(MDC_REQUEST_URI, request.getRequestURI());

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_REQUEST_ID);
            MDC.remove(MDC_METHOD);
            MDC.remove(MDC_REQUEST_URI);
        }
    }
}
