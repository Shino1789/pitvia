package com.pitvia.api.dashboard.dto.response;

import java.util.List;

/**
 * ショップロール用ダッシュボード情報
 *
 * @author pitvia
 * @version 1.0
 */
public record ShopDashboardResponse(

        /**
         * 管理車両数
         */
        ManagedVehicle managedVehicles,

        /**
         * 今月売上
         */
        long monthlySales,

        /**
         * 連携顧客数
         */
        long linkedCustomerCount,

        /**
         * 整備件数推移グラフ
         */
        DashboardChartResponse maintenanceCountChart,

        /**
         * 最近の整備履歴
         */
        List<RecentMaintenance> recentMaintenances) implements DashboardResponse {
}
