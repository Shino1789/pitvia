package com.pitvia.api.shop.repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pitvia.api.shop.entity.ShopInviteCode;

/**
 * ショップ招待コード管理テーブル (shop_invite_codes) に対するデータアクセスを管理するリポジトリ
 *
 * @author pitvia
 * @version 1.0
 */
public interface ShopInviteCodeRepository extends JpaRepository<ShopInviteCode, Long> {

    /**
     * 指定ショップの、失効していないコードを取得する（有効期限切れかどうかは問わない）
     *
     * @param shopId ショップユーザーID
     * @return 失効していないコード（存在しない場合は空）
     */
    Optional<ShopInviteCode> findByShop_IdAndRevokedAtIsNull(UUID shopId);

    /**
     * 指定ショップの、現在有効な（失効しておらず、期限内の）コードを取得する
     *
     * @param shopId ショップユーザーID
     * @param now    現在時刻
     * @return 現在有効なコード（存在しない場合は空）
     */
    Optional<ShopInviteCode> findByShop_IdAndRevokedAtIsNullAndExpiresAtAfter(UUID shopId, Instant now);

    /**
     * 指定されたコード値が既に存在するかどうかを判定する（コード生成時の衝突チェック用）
     *
     * @param code 判定対象のコード
     * @return 存在する場合はtrue
     */
    boolean existsByCode(String code);

}
