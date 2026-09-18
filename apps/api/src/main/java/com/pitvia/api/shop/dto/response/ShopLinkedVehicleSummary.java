package com.pitvia.api.shop.dto.response;

import java.util.UUID;

/**
 * ショップ一覧における連携車両のサマリー情報を表すデータ転送オブジェクト
 *
 * @author pitvia
 * @version 1.0
 */
public record ShopLinkedVehicleSummary(

        /**
         * 車両ID
         */
        UUID vehicleId,

        /**
         * 車種名（ツールチップ表示等に使用）
         */
        String vehicleName,

        /**
         * 車両画像の公開URL（未設定の場合はnull）
         */
        String imageUrl) {
}
