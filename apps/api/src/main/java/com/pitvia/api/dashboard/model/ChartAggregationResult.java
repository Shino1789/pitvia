package com.pitvia.api.dashboard.model;

import java.math.BigDecimal;

/**
 * ダッシュボードの各種推移グラフ用集計データを保持する不変オブジェクト
 */
public record ChartAggregationResult(

        /**
         * 集集期間 (例: '2026-06', '2026')
         */
        String period,

        /**
         * 整備種別コード (例: 'VEHICLE_INSPECTION')
         */
        String maintenanceTypeCode,

        /**
         * 集計値 (OWNERは費用総額、SHOPは整備件数)
         */
        BigDecimal value) {
}
