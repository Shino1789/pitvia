package com.pitvia.api.dashboard.query;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.common.constant.PeriodType;
import com.pitvia.api.dashboard.constant.DashboardChartType;
import com.pitvia.api.dashboard.dto.param.DashboardChartParam;
import com.pitvia.api.dashboard.dto.response.ChartPoint;
import com.pitvia.api.dashboard.dto.response.ChartValue;
import com.pitvia.api.dashboard.dto.response.DashboardChartResponse;
import com.pitvia.api.dashboard.model.ChartAggregationResult;
import com.pitvia.api.dashboard.repository.DashboardRepository;
import com.pitvia.api.maintenance.enums.MaintenanceType;
import com.pitvia.api.maintenance.repository.MaintenanceRecordRepository;

import lombok.RequiredArgsConstructor;

/**
 * ダッシュボードチャートクエリの共通処理を管理する抽象クラス
 */
@RequiredArgsConstructor
public abstract class AbstractDashboardChartBuilder implements DashboardQuery {

    /** 年月フォーマット（yyyy-MM） */
    private static final DateTimeFormatter YEAR_MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM");

    /** チャート集計リポジトリ */
    protected final DashboardRepository dashboardRepository;

    /** 整備履歴リポジトリ */
    protected final MaintenanceRecordRepository maintenanceRecordRepository;

    @Override
    public UserRole supports() {
        return getRole();
    }

    /**
     * チャートを生成する
     *
     * @param userId ユーザーID
     * @param param  チャート取得条件
     * @return チャートレスポンス
     */
    protected DashboardChartResponse createChart(UUID userId, DashboardChartParam param) {

        // 終了基準期間（未指定ならデフォルト）
        String endPeriodStr = param.getEndPeriodOrDefault();

        LocalDate startDate;
        LocalDate endDate;

        // 集計期間（月次・年次）を算出
        if (param.period() == PeriodType.MONTH) {

            YearMonth endMonth = YearMonth.parse(endPeriodStr, YEAR_MONTH_FORMAT);
            YearMonth startMonth = endMonth.minusMonths(param.getSize() - 1);

            startDate = startMonth.atDay(1);
            endDate = endMonth.atEndOfMonth();

        } else {

            int endYear = Integer.parseInt(endPeriodStr);
            int startYear = endYear - param.getSize() + 1;

            startDate = LocalDate.of(startYear, 1, 1);
            endDate = LocalDate.of(endYear, 12, 31);
        }

        // DBから集計結果を取得
        List<ChartAggregationResult> rawResults = dashboardRepository.findChartAggregation(
                userId,
                getRole(),
                param.period(),
                startDate,
                endDate);

        // 期間ごとにグルーピング
        Map<String, List<ChartAggregationResult>> groupedByPeriod = rawResults.stream()
                .collect(Collectors.groupingBy(ChartAggregationResult::period));

        List<ChartPoint> items = new ArrayList<>();

        // 表示期間分のチャートデータを構築
        for (int i = 0; i < param.getSize(); i++) {

            String currentPeriod;

            if (param.period() == PeriodType.MONTH) {

                currentPeriod = YearMonth.from(startDate)
                        .plusMonths(i)
                        .format(YEAR_MONTH_FORMAT);

            } else {
                currentPeriod = String.valueOf(startDate.getYear() + i);
            }

            List<ChartAggregationResult> periodData = groupedByPeriod.getOrDefault(currentPeriod, List.of());

            List<ChartValue> values = periodData.stream()
                    .map(result -> new ChartValue(
                            MaintenanceType.fromCode(result.maintenanceTypeCode()),
                            result.value().longValue()))
                    .toList();

            // 該当期間の総集計費用（工賃＋部品代）または整備件数の合計を算出
            long totalValue = periodData.stream()
                    .mapToLong(result -> result.value().longValue())
                    .sum();

            items.add(new ChartPoint(currentPeriod, totalValue, values));
        }

        // ページ移動可否を判定
        boolean canMoveBackward = canMoveBackward(userId, startDate);
        boolean canMoveForward = canMoveForward(userId, endDate);

        // ChartParamのバリデーション上、最低1件は生成される
        String startPeriod = items.getFirst().period();
        String lastPeriod = items.getLast().period();

        return new DashboardChartResponse(
                getChartType(),
                param.period(),
                startPeriod,
                lastPeriod,
                canMoveForward,
                canMoveBackward,
                items);
    }

    /**
     * 各サブクラスに対応するユーザーロールを取得
     *
     * @return ユーザー権限ロール {@link UserRole}
     */
    protected abstract UserRole getRole();

    /**
     * グラフタイトル種別を取得
     *
     * @return タイトル種別 {@link DashboardChartType}
     */
    protected abstract DashboardChartType getChartType();

    /**
     * 指定の期間より過去に、整備記録が存在するかどうかを判定
     *
     * @param userId    対象のユーザーID（またはショップID）
     * @param startDate 集計表示期間の開始日
     * @return 過去方向に移動可能な場合は true、存在しない場合は false
     */
    protected abstract boolean canMoveBackward(UUID userId, LocalDate startDate);

    /**
     * 指定の期間より未来に、整備記録が存在するかどうかを判定
     *
     * @param userId  対象のユーザーID（またはショップID）
     * @param endDate 集計表示期間の終了日
     * @return 未来方向に移動可能な場合は true、存在しない場合は false
     */
    protected abstract boolean canMoveForward(UUID userId, LocalDate endDate);

}
