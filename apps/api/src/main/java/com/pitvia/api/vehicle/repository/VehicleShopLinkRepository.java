package com.pitvia.api.vehicle.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pitvia.api.vehicle.entity.Vehicle;
import com.pitvia.api.vehicle.entity.VehicleShopLink;
import com.pitvia.api.vehicle.enums.LinkStatus;
import com.pitvia.api.vehicle.repository.projection.CustomerSummaryProjection;

/**
 * 車両ショップ連携情報テーブル (vehicle_shop_links) に対するデータアクセスを管理するリポジトリ
 *
 * @author pitvia
 * @version 1.0
 */
public interface VehicleShopLinkRepository extends JpaRepository<VehicleShopLink, Long> {

    /**
     * オーナーが現在連携しているショップの総数を取得する
     *
     * @param userId ユーザーID
     * @return 連携中ショップ数
     */
    @Query("""
            SELECT COUNT(DISTINCT vsl.shop.id)
            FROM VehicleShopLink vsl
            WHERE vsl.vehicle.user.id = :userId
              AND vsl.status = com.pitvia.api.vehicle.enums.LinkStatus.APPROVED
            """)
    long countLinkedShops(@Param("userId") UUID userId);

    /**
     * ショップが現在連携しているオーナー（顧客）の総数を取得する
     *
     * @param shopUserId ショップユーザーID
     * @return 連携中顧客（オーナー）数
     */
    @Query("""
            SELECT COUNT(DISTINCT vsl.vehicle.user.id)
            FROM VehicleShopLink vsl
            WHERE vsl.shop.id = :shopUserId
              AND vsl.status = com.pitvia.api.vehicle.enums.LinkStatus.APPROVED
            """)
    long countLinkedOwners(@Param("shopUserId") UUID shopUserId);

    /**
     * ショップと連携中（APPROVED）の顧客所有車両数を取得する
     *
     * @param shopUserId ショップユーザーID
     * @return 連携顧客車両数
     */
    @Query("""
            SELECT COUNT(DISTINCT vsl.vehicle.id)
            FROM VehicleShopLink vsl
            WHERE vsl.shop.id = :shopUserId
              AND vsl.status = com.pitvia.api.vehicle.enums.LinkStatus.APPROVED
              AND vsl.vehicle.user.id <> :shopUserId
            """)
    long countCustomerVehicles(@Param("shopUserId") UUID shopUserId);

    /**
     * ショップと連携（APPROVED）が確認できる、指定オーナーの所有車両一覧を取得する
     *
     * @param shopUserId ショップユーザーID
     * @param ownerId    対象オーナーのユーザーID
     * @return 車両一覧（登録日時降順）
     */
    @Query("""
            SELECT vsl.vehicle
            FROM VehicleShopLink vsl
            WHERE vsl.shop.id = :shopUserId
              AND vsl.vehicle.user.id = :ownerId
              AND vsl.status = com.pitvia.api.vehicle.enums.LinkStatus.APPROVED
            ORDER BY vsl.vehicle.createdAt DESC
            """)
    List<Vehicle> findApprovedVehiclesByShopAndOwner(
            @Param("shopUserId") UUID shopUserId,
            @Param("ownerId") UUID ownerId);

    /**
     * ショップが指定車両に対して、指定ステータスで連携しているかを判定する
     *
     * @param shopId    ショップユーザーID
     * @param vehicleId 対象車両ID
     * @param status    連携ステータス
     * @return 該当する連携が存在すればtrue
     */
    boolean existsByShop_IdAndVehicle_IdAndStatus(UUID shopId, UUID vehicleId, LinkStatus status);

    /**
     * ショップと連携（APPROVED）中の顧客（オーナー）を、キーワード・ページングつきで取得する
     *
     * <p>
     * 「顧客」は、ログインショップとAPPROVED状態で車両連携している所有者（オーナー）単位で
     * グルーピングして構成する（オーナーの全件取得ではなく、あくまで連携関係から導出する）。
     * </p>
     *
     * <p>
     * {@code lastMaintenanceDate}は、対象オーナーの連携車両のうち
     * <b>ログインショップ自身が実施した</b>整備履歴（{@code mr.shop.id = :shopId}）に限定して
     * 集計する。他ショップ・OWNER自身によるDIY整備履歴は含まない。連携車両のサムネイル
     * （最大3件・総数）は本メソッドの結果には含めず、{@link #findApprovedVehiclesByShopAndOwnerIn}で
     * 別途取得する（N+1を避けるため、対象ページのオーナーIDをまとめて1回で引く）。
     * </p>
     *
     * <p>
     * 並び替えはJPQL側の{@code ORDER BY}で固定しており（最終整備日 降順、ユーザー名を
     * 第二ソート条件とした安定順）、{@code pageable}にはソート指定を含めないこと。
     * </p>
     *
     * @param shopId   ショップユーザーID
     * @param keyword  顧客名（ユーザー名）の部分一致キーワード（任意。未指定時は絞り込みなし）
     * @param pageable ページング情報（ソートは無視される）
     * @return 顧客一覧（ページング付き）
     */
    @Query(value = """
            SELECT owner.id AS ownerId,
                   owner.userName AS ownerName,
                   owner.iconKey AS ownerIconKey,
                   MAX(mr.workDateFrom) AS lastMaintenanceDate
            FROM VehicleShopLink vsl
            JOIN vsl.vehicle v
            JOIN v.user owner
            LEFT JOIN MaintenanceRecord mr
                ON mr.vehicle = v
                AND mr.shop.id = :shopId
                AND mr.isDraft = false
            WHERE vsl.shop.id = :shopId
              AND vsl.status = com.pitvia.api.vehicle.enums.LinkStatus.APPROVED
              AND (:keyword IS NULL OR LOWER(owner.userName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')))
            GROUP BY owner.id, owner.userName, owner.iconKey
            ORDER BY MAX(mr.workDateFrom) DESC NULLS LAST, owner.userName ASC
            """, countQuery = """
            SELECT COUNT(DISTINCT owner.id)
            FROM VehicleShopLink vsl
            JOIN vsl.vehicle v
            JOIN v.user owner
            WHERE vsl.shop.id = :shopId
              AND vsl.status = com.pitvia.api.vehicle.enums.LinkStatus.APPROVED
              AND (:keyword IS NULL OR LOWER(owner.userName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')))
            """)
    Page<CustomerSummaryProjection> findCustomerSummaries(
            @Param("shopId") UUID shopId,
            @Param("keyword") String keyword,
            Pageable pageable);

    /**
     * ショップと連携（APPROVED）が確認できる、指定オーナー群の所有車両一覧をまとめて取得する
     *
     * <p>
     * {@link #findCustomerSummaries}で取得した顧客一覧（1ページ分）の連携車両サムネイル表示
     * （最大3件・残数）を、オーナーごとに1件ずつ問い合わせるN+1を避けてまとめて取得するために
     * 使用する。呼び出し側で{@code vehicle.getUser().getId()}によりオーナーごとにグルーピングする。
     * </p>
     *
     * @param shopId   ショップユーザーID
     * @param ownerIds 対象オーナーのユーザーID群
     * @return 車両一覧（オーナーID、登録日時降順）
     */
    @Query("""
            SELECT v
            FROM VehicleShopLink vsl
            JOIN vsl.vehicle v
            JOIN FETCH v.user owner
            WHERE vsl.shop.id = :shopId
              AND vsl.status = com.pitvia.api.vehicle.enums.LinkStatus.APPROVED
              AND owner.id IN :ownerIds
            ORDER BY owner.id, v.createdAt DESC
            """)
    List<Vehicle> findApprovedVehiclesByShopAndOwnerIn(
            @Param("shopId") UUID shopId,
            @Param("ownerIds") Collection<UUID> ownerIds);

}
