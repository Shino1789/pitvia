package com.pitvia.api.shop.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pitvia.api.shop.entity.Shop;

import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.UUID;

/**
 * 整備ショップ情報テーブル (shops) に対するデータアクセスを管理するリポジトリ
 *
 * @author pitvia
 * @version 1.0
 */
public interface ShopRepository extends JpaRepository<Shop, UUID> {

    /**
     * ユーザーIDに紐づく有効な整備ショップ情報を検索
     *
     * @param userId ユーザーID
     * @return 該当するショップ情報（存在しない場合は空）
     */
    Optional<Shop> findByUser_Id(UUID userId);

    /**
     * ユーザーIDに紐づくショップが存在するかチェック
     *
     * @param userId ユーザーID
     * @return 存在する場合は true、存在しない場合は false
     */
    boolean existsByUser_Id(UUID userId);

    /**
     * ショップ情報を排他ロック（{@code SELECT ... FOR UPDATE}）付きで取得する
     *
     * <p>
     * 招待コードの発行・再発行処理で、同一ショップからの同時リクエストによる
     * 「失効していないコードが常に1件のみ」という不変条件の競合を防ぐために使用する。
     * トランザクション終了までロックが保持されるため、同一ショップに対する発行処理は
     * 事実上直列化される（他ショップの処理には影響しない）。
     * </p>
     *
     * @param shopId ショップユーザーID
     * @return 該当するショップ情報（存在しない場合は空）
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Shop s WHERE s.id = :shopId")
    Optional<Shop> findByIdForUpdate(@Param("shopId") UUID shopId);

}
