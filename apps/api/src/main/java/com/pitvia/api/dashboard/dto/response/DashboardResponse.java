package com.pitvia.api.dashboard.dto.response;

/**
 * ダッシュボード共通レスポンスインターフェース
 *
 * @author pitvia
 * @version 1.0
 */
public sealed interface DashboardResponse
        permits OwnerDashboardResponse, ShopDashboardResponse {
}
