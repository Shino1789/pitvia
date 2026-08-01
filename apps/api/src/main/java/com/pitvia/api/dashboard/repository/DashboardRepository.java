package com.pitvia.api.dashboard.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.common.constant.PeriodType;
import com.pitvia.api.dashboard.model.ChartAggregationResult;

/**
 * ダッシュボード集計・分析専用のデータアクセス操作を定義するリポジトリインターフェース
 */
public interface DashboardRepository {

    /**
     * 指定されたコンテキスト（ロール、集計単位、期間制限）に応じたグラフ用データを取得する
     *
     * @param targetId   オーナーのユーザーID または ショップのユーザーID
     * @param role       ユーザー権限
     * @param periodType グラフの集計単位 (MONTH / YEAR)
     * @param startDate  集計期間の開始日
     * @param endDate    集計期間の終了日
     * @return 期間・種別ごとにフラット化された集計結果のリスト
     */
    List<ChartAggregationResult> findChartAggregation(
            UUID targetId,
            UserRole role,
            PeriodType periodType,
            LocalDate startDate,
            LocalDate endDate);
}
