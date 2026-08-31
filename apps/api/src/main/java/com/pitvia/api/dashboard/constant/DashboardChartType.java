package com.pitvia.api.dashboard.constant;

/**
 * ダッシュボードグラフ種別を表す列挙型
 *
 * @author pitvia
 * @version 1.0
 */
public enum DashboardChartType {

    /**
     * 整備費用推移グラフ
     *
     * <p>
     * OWNER向けダッシュボードで使用。
     * 指定期間ごとの整備費用合計を表示する。
     * </p>
     */
    MAINTENANCE_COST_TREND,

    /**
     * 整備件数推移グラフ
     *
     * <p>
     * SHOP向けダッシュボードで使用。
     * 指定期間ごとの整備記録件数を表示する。
     * </p>
     */
    MAINTENANCE_COUNT_TREND
}
