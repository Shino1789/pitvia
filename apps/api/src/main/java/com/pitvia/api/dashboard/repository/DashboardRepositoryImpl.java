package com.pitvia.api.dashboard.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.common.constant.PeriodType;
import com.pitvia.api.dashboard.model.ChartAggregationResult;
import lombok.RequiredArgsConstructor;

/**
 * {@link DashboardRepository} の実装クラス
 *
 * @author pitvia
 * @version 1.0
 */
@Repository
@RequiredArgsConstructor
public class DashboardRepositoryImpl implements DashboardRepository {

    /** JDBCによる高速データアクセス用クライアント */
    private final JdbcClient jdbcClient;

    @Override
    public List<ChartAggregationResult> findChartAggregation(
            UUID targetId,
            UserRole role,
            PeriodType periodType,
            LocalDate startDate,
            LocalDate endDate) {

        // 集計単位（月次・年次）に応じた期間フォーマット（PostgreSQL表現式）を決定
        String periodExpression = (periodType == PeriodType.MONTH)
                ? "TO_CHAR(mr.work_date_from, 'YYYY-MM')"
                : "TO_CHAR(mr.work_date_from, 'YYYY')";

        // SQLを動的に構築するための各句を宣言
        String selectValue;
        String joinClause;
        String roleCondition;

        // 渡されたロールに応じて集計カラム、結合句、および抽出条件を動的に切り替える
        if (role == UserRole.OWNER) {
            // OWNER：工賃＋部品代の費用総額を集計
            selectValue = "SUM(COALESCE(wi_sum.total_labor, 0) + COALESCE(part_sum.total_parts, 0))";

            // 【バグ回避】作業明細と部品明細をそのままJOINすると、1対多の関係により金額が多重加算（デカルト積）されるため、
            // あらかじめインラインビュー（サブクエリ）側でレコード単位に合計値を aggregation してから結合する
            joinClause = """
                    LEFT JOIN (
                        SELECT maintenance_record_id, SUM(labor_cost) AS total_labor
                        FROM maintenance_work_items
                        GROUP BY maintenance_record_id
                    ) wi_sum ON wi_sum.maintenance_record_id = mr.id
                    LEFT JOIN (
                        SELECT wi.maintenance_record_id,
                               SUM(p.unit_price * p.quantity) AS total_parts
                        FROM maintenance_parts p
                        JOIN maintenance_work_items wi
                          ON wi.id = p.maintenance_work_item_id
                        GROUP BY wi.maintenance_record_id
                    ) part_sum ON part_sum.maintenance_record_id = mr.id
                    """;

            // 所有している車両データのみを対象とし、車両側の論理削除も合わせてガードする
            roleCondition = "AND v.user_id = :targetId AND v.deleted_at IS NULL";

        } else if (role == UserRole.SHOP) {
            // SHOP：店舗が実施した下書き以外の純粋な「整備件数」を集計
            selectValue = "COUNT(DISTINCT mr.id)";
            joinClause = "";
            roleCondition = "AND mr.shop_id = :targetId";

        } else {
            // 将来的な権限追加時におけるダッシュボード表示ロジックの実装漏れを検知
            throw new IllegalStateException("Unsupported role: " + role);
        }

        // SQLを構築
        String sql = """
                SELECT
                    %1$s AS period,
                    mt.code AS maintenanceTypeCode,
                    %2$s AS value
                FROM maintenance_records mr
                JOIN vehicles v
                  ON v.id = mr.vehicle_id
                JOIN maintenance_types mt
                  ON mt.id = mr.maintenance_type_id
                %3$s
                WHERE mr.is_draft = false
                  AND mr.work_date_from BETWEEN :startDate AND :endDate
                  AND mr.deleted_at IS NULL
                  %4$s
                GROUP BY
                    %1$s,
                    mt.code
                ORDER BY
                    %1$s ASC
                """.formatted(
                periodExpression,
                selectValue,
                joinClause,
                roleCondition);

        // クエリの実行とマッピングして返却
        return jdbcClient.sql(sql)
                .param("targetId", targetId)
                .param("startDate", startDate)
                .param("endDate", endDate)
                .query(ChartAggregationResult.class)
                .list();
    }
}
