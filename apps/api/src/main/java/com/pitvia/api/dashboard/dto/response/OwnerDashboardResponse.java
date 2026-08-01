package com.pitvia.api.dashboard.dto.response;

import java.util.List;

/**
 * オーナーロール用ダッシュボードレスポンス
 *
 * @author pitvia
 * @version 1.0
 */
public record OwnerDashboardResponse(

        /**
         * 登録車両数
         */
        long vehicleCount,

        /**
         * 整備履歴数
         */
        long maintenanceCount,

        /**
         * 連携ショップ数
         */
        long linkedShopCount,

        /**
         * 整備費用推移グラフ
         */
        DashboardChartResponse maintenanceCostChart,

        /**
         * 最近の整備履歴
         */
        List<RecentMaintenance> recentMaintenances) implements DashboardResponse {
}
