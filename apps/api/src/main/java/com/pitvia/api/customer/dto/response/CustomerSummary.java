package com.pitvia.api.customer.dto.response;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * 顧客一覧の1件分のデータを表すデータ転送オブジェクト
 *
 * @author pitvia
 * @version 1.0
 */
public record CustomerSummary(

        /**
         * 顧客（オーナー）のユーザーID
         */
        UUID ownerId,

        /**
         * 顧客のユーザー名
         */
        String ownerName,

        /**
         * 顧客のユーザーアイコン公開URL（未設定の場合はnull）
         */
        String ownerIconUrl,

        /**
         * ログインショップ自身が実施した整備履歴のうち、最も新しい作業開始日
         */
        LocalDate lastMaintenanceDate,

        /**
         * このショップと連携（APPROVED）している顧客の車両のうち最大3件
         */
        List<CustomerVehicleSummary> linkedVehicles,

        /**
         * 連携車両の総数（{@code linkedVehicles}は先頭3件のみを含むため、残数表示に利用する）
         */
        long linkedVehicleCount) {
}
