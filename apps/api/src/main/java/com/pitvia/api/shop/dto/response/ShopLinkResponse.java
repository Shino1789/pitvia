package com.pitvia.api.shop.dto.response;

import java.time.Instant;
import java.util.UUID;

import com.pitvia.api.vehicle.entity.VehicleShopLink;
import com.pitvia.api.vehicle.enums.LinkStatus;

/**
 * ショップ連携（招待コード入力）成功時のレスポンスDTO
 *
 * @author pitvia
 * @version 1.0
 */
public record ShopLinkResponse(

        /**
         * 連携先ショップID
         */
        UUID shopId,

        /**
         * 連携先ショップ名（ユーザー名）
         */
        String shopName,

        /**
         * 連携対象の車両ID
         */
        UUID vehicleId,

        /**
         * 連携ステータス（ベータ版では常に{@code APPROVED}）
         */
        LinkStatus status,

        /**
         * 連携承認日時
         */
        Instant approvedAt) {

    /**
     * {@link VehicleShopLink}エンティティからレスポンスDTOを生成する
     *
     * @param link 作成済みの車両ショップ連携エンティティ
     * @return ShopLinkResponse
     */
    public static ShopLinkResponse from(VehicleShopLink link) {
        return new ShopLinkResponse(
                link.getShop().getId(),
                link.getShop().getUser().getUserName(),
                link.getVehicle().getId(),
                link.getStatus(),
                link.getApprovedAt());
    }
}
