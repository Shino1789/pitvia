package com.pitvia.api.maintenance.repository;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pitvia.api.maintenance.entity.MaintenanceWorkItem;
import com.pitvia.api.maintenance.repository.projection.MonthlySalesProjection;

/**
 * 整備作業明細テーブル (maintenance_work_items) に対するデータアクセスを管理するリポジトリ
 *
 * @author pitvia
 * @version 1.0
 */
public interface MaintenanceWorkItemRepository extends JpaRepository<MaintenanceWorkItem, Long> {

    /**
     * 指定されたショップの、特定期間内の総売上（工賃＋部品代）を集計する
     *
     * @param shopId    ショップID
     * @param startDate 集計開始日
     * @param endDate   集計終了日
     * @return 売上集計結果
     */
    @Query("""
            SELECT
                COALESCE(
                    SUM(
                        COALESCE(wiSum.totalLabor, 0) + COALESCE(partSum.totalParts, 0)
                    ), 0) AS totalSales
            FROM MaintenanceRecord mr
            LEFT JOIN (
                SELECT
                    wi.maintenanceRecord.id AS maintenanceRecordId,
                    SUM(wi.laborCost) AS totalLabor
                FROM MaintenanceWorkItem wi
                GROUP BY wi.maintenanceRecord.id
            ) wiSum
                ON wiSum.maintenanceRecordId = mr.id
            LEFT JOIN (
                SELECT
                    wi.maintenanceRecord.id AS maintenanceRecordId,
                    SUM(p.unitPrice * p.quantity) AS totalParts
                FROM MaintenancePart p
                JOIN p.maintenanceWorkItem wi
                GROUP BY wi.maintenanceRecord.id
            ) partSum
                ON partSum.maintenanceRecordId = mr.id
            WHERE mr.shop.id = :shopId
              AND mr.workDateFrom BETWEEN :startDate AND :endDate
              AND mr.isDraft = false
            """)
    MonthlySalesProjection calculateSales(
            @Param("shopId") UUID shopId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

}
