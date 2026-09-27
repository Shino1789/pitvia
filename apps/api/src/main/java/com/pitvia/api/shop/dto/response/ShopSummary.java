package com.pitvia.api.shop.dto.response;

import java.util.List;
import java.util.UUID;

/**
 * ショップ一覧の1件分のデータを表すデータ転送オブジェクト
 *
 * @author pitvia
 * @version 1.0
 */
public record ShopSummary(

        /**
         * ショップID
         */
        UUID shopId,

        /**
         * ショップ名（ユーザー名）
         */
        String shopName,

        /**
         * ショップのユーザーアイコン公開URL（未設定の場合はnull）
         */
        String shopIconUrl,

        /**
         * 住所
         */
        String address,

        /**
         * 電話番号
         */
        String phoneNumber,

        /**
         * このショップとOWNERが連携（APPROVED）している車両のうち最大3件
         */
        List<ShopLinkedVehicleSummary> linkedVehicles,

        /**
         * 連携車両の総数（{@code linkedVehicles}は先頭3件のみを含むため、残数表示に利用する）
         */
        long linkedVehicleCount) {
}
