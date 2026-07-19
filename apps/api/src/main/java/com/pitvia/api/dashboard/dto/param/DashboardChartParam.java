package com.pitvia.api.dashboard.dto.param;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;

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
         * 集計の終了基準期間 (例: "2026-06")
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
     * 初期表示用（デフォルト：月次・当月基準・直近6件分）のパラメータオブジェクトを生成する静的ファクトリメソッド
     *
     * @return 初期表示用の {@link DashboardChartParam}
     */
    public static DashboardChartParam defaultMonth() {
        return new DashboardChartParam(
                PeriodType.MONTH,
                YearMonth.now().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                DEFAULT_SIZE);
    }

    /**
     * 集計の終了基準期間を取得
     *
     * @return 終了基準期間文字列
     */
    public String getEndPeriodOrDefault() {
        return hasEndPeriod() ? endPeriod : defaultMonth().endPeriod();
    }

    /**
     * データ取得件数を返す
     * フィールドの {@code size} が指定されていない場合は、デフォルト値を返す
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
