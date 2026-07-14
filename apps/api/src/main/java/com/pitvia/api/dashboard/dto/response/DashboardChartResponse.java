package com.pitvia.api.dashboard.dto.response;

import java.util.List;

import com.pitvia.api.dashboard.constant.DashboardPeriodType;

/**
 * ダッシュボードグラフレスポンス
 *
 * @author pitvia
 * @version 1.0
 */
public record DashboardChartResponse(

        /**
         * グラフタイトル
         */
        String title,

        /**
         * 集計単位
         */
        DashboardPeriodType periodType,

        /**
         * 集計開始期間
         */
        String startPeriod,

        /**
         * 集計終了期間
         */
        String endPeriod,

        /**
         * 次の期間への移動可否フラグ
         */
        boolean canMoveForward,

        /**
         * 前の期間への移動可否フラグ
         */
        boolean canMoveBackward,

        /**
         * グラフデータリスト
         */
        List<ChartPoint> items) {
}
