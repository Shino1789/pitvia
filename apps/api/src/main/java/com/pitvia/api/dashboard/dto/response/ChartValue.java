package com.pitvia.api.dashboard.dto.response;

import com.pitvia.api.maintenance.enums.MaintenanceType;

/**
 * グラフの項目別内訳データ
 *
 * @author pitvia
 * @version 1.0
 */
public record ChartValue(

        /**
         * 整備種別
         */
        MaintenanceType category,

        /**
         * 集計値
         */
        long value) {
}
