package com.pitvia.api.dashboard.query;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.common.constant.PeriodType;
import com.pitvia.api.dashboard.constant.DashboardChartType;
import com.pitvia.api.dashboard.dto.param.DashboardChartParam;
import com.pitvia.api.dashboard.dto.response.ChartPoint;
import com.pitvia.api.dashboard.dto.response.ChartValue;
import com.pitvia.api.dashboard.dto.response.DashboardChartResponse;
import com.pitvia.api.dashboard.dto.response.DashboardResponse;
import com.pitvia.api.dashboard.dto.response.OwnerDashboardResponse;
import com.pitvia.api.dashboard.model.ChartAggregationResult;
import com.pitvia.api.dashboard.repository.DashboardRepository;
import com.pitvia.api.maintenance.enums.MaintenanceType;
import com.pitvia.api.maintenance.repository.MaintenanceRecordRepository;
import com.pitvia.api.vehicle.repository.VehicleRepository;
import com.pitvia.api.vehicle.repository.VehicleShopLinkRepository;

import lombok.RequiredArgsConstructor;

/**
 * オーナー権限（OWNER）専用のダッシュボード表示データおよびチャート情報を構築する戦略クラス
 */
@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OwnerDashboardQuery implements DashboardQuery {

    /** 年月フォーマット（yyyy-MM） */
    private static final DateTimeFormatter YEAR_MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM");

    /** 車両情報リポジトリ */
    private final VehicleRepository vehicleRepository;

    /** 整備履歴リポジトリ */
    private final MaintenanceRecordRepository maintenanceRecordRepository;

    /** 車両・ショップ連携リポジトリ */
    private final VehicleShopLinkRepository vehicleShopLinkRepository;

    /** ダッシュボード集計リポジトリ */
    private final DashboardRepository dashboardRepository;

    @Override
    public UserRole supports() {
        return UserRole.OWNER;
    }

    @Override
    public DashboardResponse execute(UUID userId, DashboardChartParam param) {

        // カード表示用の集計値を取得
        long vehicleCount = vehicleRepository.countByUser_Id(userId);
        long maintenanceCount = maintenanceRecordRepository.countByVehicle_User_Id(userId);
        long linkedShopCount = vehicleShopLinkRepository.countLinkedShops(userId);

        // 初期表示用チャートを生成
        DashboardChartResponse chartResponse = createChart(userId, param);

        // ダッシュボード全体レスポンスを構築
        return new OwnerDashboardResponse(
                vehicleCount,
                maintenanceCount,
                linkedShopCount,
                chartResponse);
    }

    @Override
    public DashboardChartResponse getChart(UUID userId, DashboardChartParam param) {
        // チャート生成メソッドを呼び出し結果を返却
        return createChart(userId, param);
    }

    /**
     * 費用推移チャートを生成する。
     *
     * @param userId 対象ユーザーID
     * @param param  グラフ取得条件
     * @return チャートレスポンス
     */
    private DashboardChartResponse createChart(UUID userId, DashboardChartParam param) {

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
                UserRole.OWNER,
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

            // 該当期間の総集計費用（工賃＋部品代）の合計を算出
            long totalValue = periodData.stream()
                    .mapToLong(result -> result.value().longValue())
                    .sum();

            items.add(new ChartPoint(currentPeriod, totalValue, values));
        }

        // ページ移動可否を判定
        boolean canMoveBackward = maintenanceRecordRepository.existsOwnerBeforeDate(userId, startDate);

        boolean canMoveForward = maintenanceRecordRepository.existsOwnerAfterDate(userId, endDate);

        // ChartParamのバリデーション上、最低1件は生成される
        String startPeriod = items.getFirst().period();
        String lastPeriod = items.getLast().period();

        return new DashboardChartResponse(
                DashboardChartType.MAINTENANCE_COST_TREND,
                param.period(),
                startPeriod,
                lastPeriod,
                canMoveForward,
                canMoveBackward,
                items);
    }
}
