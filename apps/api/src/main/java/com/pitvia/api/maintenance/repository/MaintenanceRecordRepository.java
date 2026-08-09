package com.pitvia.api.maintenance.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pitvia.api.maintenance.entity.MaintenanceRecord;
import com.pitvia.api.maintenance.repository.projection.RecentMaintenanceProjection;

/**
 * 整備記録ヘッダーテーブル (maintenance_records) に対するデータアクセスを管理するリポジトリ
 *
 * @author pitvia
 * @version 1.0
 */
public interface MaintenanceRecordRepository extends JpaRepository<MaintenanceRecord, UUID> {

    /**
     * ユーザーが所有する全車両の整備履歴総数を取得
     *
     * @param userId ユーザーID
     * @return 整備履歴総数
     */
    long countByVehicle_User_Id(UUID userId);

    /**
     * OWNERユーザー向け：指定された基準日より過去の整備記録が存在するか判定する
     *
     * @param ownerId オーナーのユーザーID
     * @param date    集計の基準となる開始日
     * @return 基準日より前にレコードが存在する場合は true、存在しない場合は false
     */
    @Query("""
            SELECT EXISTS (
                SELECT 1
                FROM MaintenanceRecord mr
                JOIN mr.vehicle v
                WHERE v.user.id = :ownerId
                  AND mr.isDraft = false
                  AND mr.workDateFrom < :date
            )
            """)
    boolean existsOwnerBeforeDate(@Param("ownerId") UUID ownerId, @Param("date") LocalDate date);

    /**
     * OWNERユーザー向け：指定された基準日より未来の整備記録が存在するか判定する
     *
     * @param ownerId オーナーのユーザーID
     * @param date    集計の基準となる開始日
     * @return 基準日より後ろにレコードが存在する場合は true、存在しない場合は false
     */
    @Query("""
            SELECT EXISTS (
                SELECT 1
                FROM MaintenanceRecord mr
                JOIN mr.vehicle v
                WHERE v.user.id = :ownerId
                  AND mr.isDraft = false
                  AND mr.workDateFrom > :date
            )
            """)
    boolean existsOwnerAfterDate(@Param("ownerId") UUID ownerId, @Param("date") LocalDate date);

    /**
     * SHOPユーザー向け：指定された基準日より過去の自店舗の整備実績が存在するか判定する
     *
     * @param shopId ショップのユーザーID
     * @param date   集計の基準となる開始日
     * @return 基準日より前に実績が存在する場合は true、存在しない場合は false
     */
    @Query("""
            SELECT EXISTS (
                SELECT 1
                FROM MaintenanceRecord mr
                WHERE mr.shop.id = :shopId
                  AND mr.isDraft = false
                  AND mr.workDateFrom < :date
            )
            """)
    boolean existsShopBeforeDate(@Param("shopId") UUID shopId, @Param("date") LocalDate date);

    /**
     * SHOPユーザー向け：指定された基準日より未来の自店舗の整備実績が存在するか判定する
     *
     * @param shopId ショップのユーザーID
     * @param date   集計の基準となる終了日
     * @return 基準日より後ろに実績が存在する場合は true、存在しない場合は false
     */
    @Query("""
            SELECT EXISTS (
                SELECT 1
                FROM MaintenanceRecord mr
                WHERE mr.shop.id = :shopId
                  AND mr.isDraft = false
                  AND mr.workDateFrom > :date
            )
            """)
    boolean existsShopAfterDate(@Param("shopId") UUID shopId, @Param("date") LocalDate date);

    /**
     * OWNERユーザー向け：自分が所有する車両の最近の整備履歴を取得
     *
     * @param ownerId  オーナーのユーザーID
     * @param pageable ページング・件数制御情報
     * @return 指定期間内の整備履歴
     */
    @Query("""
            SELECT
                mr.id AS id,
                v.modelName AS vehicleName,
                owner.userName AS ownerName,
                mt.code AS maintenanceTypeCode,
                mr.title AS title,
                mr.workDateFrom AS workDateFrom,
                mr.workDateTo AS workDateTo,
                u.userName AS shopName,
                COALESCE(
                    (
                        SELECT SUM(wi.laborCost)
                        FROM MaintenanceWorkItem wi
                        WHERE wi.maintenanceRecord = mr
                    ), 0)
                +
                COALESCE(
                    (
                        SELECT SUM(p.unitPrice * p.quantity)
                        FROM MaintenancePart p
                        JOIN p.maintenanceWorkItem wi
                        WHERE wi.maintenanceRecord = mr
                    ), 0) AS totalCost
            FROM MaintenanceRecord mr
            JOIN mr.vehicle v
            JOIN v.user owner
            JOIN mr.maintenanceType mt
            LEFT JOIN mr.shop s
            LEFT JOIN s.user u
            WHERE v.user.id = :ownerId
              AND mr.isDraft = false
            ORDER BY mr.workDateFrom DESC, mr.createdAt DESC
            """)
    List<RecentMaintenanceProjection> findRecentOwnerMaintenances(@Param("ownerId") UUID ownerId, Pageable pageable);

    /**
     * SHOPユーザー向け：自店舗が実施した、連携中顧客の車両を含む最近の整備履歴を取得
     *
     * @param shopId   ショップID
     * @param pageable ページング
     * @return 指定期間内の整備履歴
     */
    @Query("""
            SELECT
                mr.id AS id,
                v.modelName AS vehicleName,
                owner.userName AS ownerName,
                mt.code AS maintenanceTypeCode,
                mr.title AS title,
                mr.workDateFrom AS workDateFrom,
                mr.workDateTo AS workDateTo,
                u.userName AS shopName,
                COALESCE(
                    (
                        SELECT SUM(wi.laborCost)
                        FROM MaintenanceWorkItem wi
                        WHERE wi.maintenanceRecord = mr
                    ), 0)
                +
                COALESCE(
                    (
                        SELECT SUM(p.unitPrice * p.quantity)
                        FROM MaintenancePart p
                        JOIN p.maintenanceWorkItem wi
                        WHERE wi.maintenanceRecord = mr
                    ), 0) AS totalCost
            FROM MaintenanceRecord mr
            JOIN mr.vehicle v
            JOIN v.user owner
            JOIN mr.maintenanceType mt
            JOIN mr.shop s
            JOIN s.user u
            WHERE s.id = :shopId
              AND mr.isDraft = false
            ORDER BY mr.workDateFrom DESC, mr.createdAt DESC
            """)
    List<RecentMaintenanceProjection> findRecentShopMaintenances(@Param("shopId") UUID shopId, Pageable pageable);
}
