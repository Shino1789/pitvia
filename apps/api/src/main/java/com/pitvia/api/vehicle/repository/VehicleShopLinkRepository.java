package com.pitvia.api.vehicle.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pitvia.api.vehicle.entity.VehicleShopLink;

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

}
