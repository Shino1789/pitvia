package com.pitvia.api.dashboard.dto.param;

import com.pitvia.api.common.constant.PeriodType;
import com.pitvia.api.common.validation.annotation.PeriodFormat;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * グラフデータ取得リクエストパラメータ
 *
 * @author pitvia
 * @version 1.0
 */
@PeriodFormat
public record DashboardChartParam(

        /**
         * 集計単位（月か年）
         */
        @NotNull PeriodType period,

        /**
         * 集計の終了基準期間
         */
        String endPeriod,

        /**
         * endPeriodを基準に、過去方向へ取得する期間数
         */
        @Min(1) Integer size) {

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
