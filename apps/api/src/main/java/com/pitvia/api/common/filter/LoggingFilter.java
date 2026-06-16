package com.pitvia.api.common.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * リクエスト開始と終了ログ出力フィルタ。
 *
 * @author pitvia
 * @version 1.0
 */
@Order(2)
@Component
public class LoggingFilter extends OncePerRequestFilter {

    /**
     * ロガー
     */
    private static final Logger log = LoggerFactory.getLogger(LoggingFilter.class);

    /**
     * リクエスト単位でログを出力する。
     *
     * @param request     HTTPリクエスト
     * @param response    HTTPレスポンス
     * @param filterChain フィルタチェーン
     * @throws ServletException サーブレット例外
     * @throws IOException      入出力例外
     */
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // リクエスト開始時刻
        long start = System.currentTimeMillis();

        try {
            // リクエスト開始ログ出力
            log.info("REQUEST START");

            // 次のフィルタ または Controllerへ処理を渡す
            filterChain.doFilter(request, response);

        } finally {

            // 処理時間計算
            long duration = System.currentTimeMillis() - start;

            // リクエスト終了ログ出力
            log.info("REQUEST END status={} duration={}ms",
                     response.getStatus(),
                     duration);
        }
    }
}
