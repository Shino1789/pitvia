package com.pitvia.api.dashboard.dto.response;

import java.util.List;

/**
 * 棒グラフの1本分に対応する期間、総集計値、およびその内訳リスト保持する
 *
 * @author pitvia
 * @version 1.0
 */
public record ChartPoint(

        /**
         * 集計期間
         */
        String period,

        /**
         * 総集計値
         */
        long totalValue,

        /**
         * 期間内のカテゴリ別集計値（内訳）
         */
        List<ChartValue> breakdown) {
}
