package com.pitvia.api.dashboard.dto.param;

import com.pitvia.api.dashboard.constant.DashboardPeriodType;

/**
 * グラフデータ取得リクエストパラメータ
 *
 * @author pitvia
 * @version 1.0
 */
public record DashboardChartParam(

        /**
         * 集計単位（月か年）
         */
        DashboardPeriodType period,

        /**
         * 集計の終了基準期間
         */
        String endPeriod,

        /**
         * データ取得件数
         */
        Integer size) {

    /**
     * デフォルトのデータ取得件数
     */
    private static final int DEFAULT_SIZE = 6;

    /**
     * データ取得件数を返す
     * 引数の {@code size} が指定されていない場合は、デフォルト値を返す
     *
     * @return データ取得件数
     */
    public int getSize() {
        return size == null ? DEFAULT_SIZE : size;
    }

    /**
     * 集計の終了基準期間が指定されているかどうかを判定する
     *
     * @return 終了基準期間が指定されている場合は true
     */
    public boolean hasEndPeriod() {
        return endPeriod != null && !endPeriod.isBlank();
    }
}
