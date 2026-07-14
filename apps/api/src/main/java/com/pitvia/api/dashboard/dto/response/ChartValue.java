package com.pitvia.api.dashboard.dto.response;

import com.pitvia.api.dashboard.constant.DashboardChartCategory;

/**
 * グラフの項目別内訳データ
 *
 * @author pitvia
 * @version 1.0
 */
public record ChartValue(

        /**
         * ラベルコード
         */
        DashboardChartCategory category,

        /**
         * 集計値
         */
        long value) {
}
