package com.pitvia.api.dashboard.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pitvia.api.auth.principal.JwtPrincipal;
import com.pitvia.api.common.constant.ApiPaths;
import com.pitvia.api.common.dto.response.ApiResponse;
import com.pitvia.api.common.factory.ResponseFactory;
import com.pitvia.api.dashboard.dto.param.DashboardChartParam;
import com.pitvia.api.dashboard.dto.response.DashboardChartResponse;
import com.pitvia.api.dashboard.dto.response.DashboardResponse;
import com.pitvia.api.dashboard.service.DashboardService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * ダッシュボード関連のAPIエンドポイントを提供するコントローラークラス
 */
@RestController
@RequestMapping(ApiPaths.DASHBOARD)
@RequiredArgsConstructor
public class DashboardController {

    /** ダッシュボード情報取得サービス */
    private final DashboardService dashboardService;

    /** レスポンスオブジェクト生成ファクトリ */
    private final ResponseFactory responseFactory;

    /**
     * ダッシュボードの初期化
     *
     * @param principal   認証済みユーザー情報
     * @param httpRequest HTTPリクエスト
     * @return ユーザー権限に応じたダッシュボード情報
     */
    @GetMapping
    public ApiResponse<DashboardResponse> getDashboard(
            @AuthenticationPrincipal JwtPrincipal principal,
            HttpServletRequest httpRequest) {

        DashboardResponse response = dashboardService.getDashboard(principal);
        return responseFactory.success(httpRequest, response);
    }

    /**
     * ダッシュボードのグラフデータを返す
     *
     * @param principal   認証済みユーザー情報
     * @param param       リクエストパラメータ
     * @param httpRequest HTTPリクエスト
     * @return ユーザー権限に応じたグラフ表示用データ
     */
    @GetMapping("/chart")
    public ApiResponse<DashboardChartResponse> getChart(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @ModelAttribute DashboardChartParam param,
            HttpServletRequest httpRequest) {

        DashboardChartResponse response = dashboardService.getChart(principal, param);
        return responseFactory.success(httpRequest, response);
    }
}
