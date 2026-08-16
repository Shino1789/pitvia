package com.pitvia.api.maintenance.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pitvia.api.maintenance.entity.MaintenanceRecord;
import com.pitvia.api.maintenance.repository.projection.MaintenanceRecordListProjection;
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

    /**
     * ユーザーが所有する車両の整備履歴を、ページング・絞り込み・並び替え付きで取得する
     *
     * @param userId               ユーザーID
     * @param vehicleId            対象車両ID（任意。未指定時は全車両が対象）
     * @param maintenanceTypeCodes 整備種別コードによる絞り込み（任意。未指定時は絞り込みなし）
     * @param keyword              整備タイトルの部分一致キーワード（任意）
     * @param pageable             ページング・並び替え情報
     * @return 整備履歴一覧（ページング付き）
     */
    @Query(value = """
            SELECT
                mr.id AS id,
                v.id AS vehicleId,
                v.modelName AS vehicleModelName,
                v.modelCode AS vehicleModelCode,
                mt.code AS maintenanceTypeCode,
                mr.title AS title,
                mr.workDateFrom AS workDateFrom,
                mr.workDateTo AS workDateTo,
                mr.mileage AS mileage,
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
                    ), 0) AS totalCost,
                su.userName AS shopName
            FROM MaintenanceRecord mr
            JOIN mr.vehicle v
            JOIN mr.maintenanceType mt
            LEFT JOIN mr.shop s
            LEFT JOIN s.user su
            WHERE v.user.id = :userId
              AND mr.isDraft = false
              AND (:vehicleId IS NULL OR v.id = :vehicleId)
              AND (:maintenanceTypeCodes IS NULL OR mt.code IN :maintenanceTypeCodes)
              AND (:keyword IS NULL OR LOWER(mr.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')))
            """, countQuery = """
            SELECT COUNT(mr)
            FROM MaintenanceRecord mr
            JOIN mr.vehicle v
            WHERE v.user.id = :userId
              AND mr.isDraft = false
              AND (:vehicleId IS NULL OR v.id = :vehicleId)
              AND (:maintenanceTypeCodes IS NULL OR mr.maintenanceType.code IN :maintenanceTypeCodes)
              AND (:keyword IS NULL OR LOWER(mr.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')))
            """)
    Page<MaintenanceRecordListProjection> findSelfMaintenanceRecords(
            @Param("userId") UUID userId,
            @Param("vehicleId") UUID vehicleId,
            @Param("maintenanceTypeCodes") Set<String> maintenanceTypeCodes,
            @Param("keyword") String keyword,
            Pageable pageable);

    /**
     * SHOPが、指定オーナー（顧客）とAPPROVED状態で連携している車両の整備履歴を、
     * ページング・絞り込み・並び替え付きで取得する
     *
     * @param shopId               ショップユーザーID
     * @param ownerId              対象オーナーのユーザーID
     * @param maintenanceTypeCodes 整備種別コードによる絞り込み（任意。未指定時は絞り込みなし）
     * @param keyword              整備タイトルの部分一致キーワード（任意）
     * @param pageable             ページング・並び替え情報
     * @return 整備履歴一覧（ページング付き）
     */
    @Query(value = """
            SELECT
                mr.id AS id,
                v.id AS vehicleId,
                v.modelName AS vehicleModelName,
                v.modelCode AS vehicleModelCode,
                mt.code AS maintenanceTypeCode,
                mr.title AS title,
                mr.workDateFrom AS workDateFrom,
                mr.workDateTo AS workDateTo,
                mr.mileage AS mileage,
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
                    ), 0) AS totalCost,
                su.userName AS shopName
            FROM MaintenanceRecord mr
            JOIN mr.vehicle v
            JOIN mr.maintenanceType mt
            LEFT JOIN mr.shop s
            LEFT JOIN s.user su
            WHERE v.user.id = :ownerId
              AND mr.isDraft = false
              AND EXISTS (
                  SELECT 1 FROM VehicleShopLink vsl
                  WHERE vsl.vehicle = v
                    AND vsl.shop.id = :shopId
                    AND vsl.status = com.pitvia.api.vehicle.enums.LinkStatus.APPROVED
              )
              AND (:maintenanceTypeCodes IS NULL OR mt.code IN :maintenanceTypeCodes)
              AND (:keyword IS NULL OR LOWER(mr.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')))
            """, countQuery = """
            SELECT COUNT(mr)
            FROM MaintenanceRecord mr
            JOIN mr.vehicle v
            WHERE v.user.id = :ownerId
              AND mr.isDraft = false
              AND EXISTS (
                  SELECT 1 FROM VehicleShopLink vsl
                  WHERE vsl.vehicle = v
                    AND vsl.shop.id = :shopId
                    AND vsl.status = com.pitvia.api.vehicle.enums.LinkStatus.APPROVED
              )
              AND (:maintenanceTypeCodes IS NULL OR mr.maintenanceType.code IN :maintenanceTypeCodes)
              AND (:keyword IS NULL OR LOWER(mr.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')))
            """)
    Page<MaintenanceRecordListProjection> findOwnerMaintenanceRecords(
            @Param("shopId") UUID shopId,
            @Param("ownerId") UUID ownerId,
            @Param("maintenanceTypeCodes") Set<String> maintenanceTypeCodes,
            @Param("keyword") String keyword,
            Pageable pageable);
}
