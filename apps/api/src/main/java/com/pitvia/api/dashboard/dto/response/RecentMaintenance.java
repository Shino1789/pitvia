package com.pitvia.api.dashboard.dto.response;

import java.time.LocalDate;
import java.util.UUID;

import com.pitvia.api.maintenance.enums.MaintenanceType;

/**
 * ダッシュボード画面の「最近の整備履歴」セクションに表示する明細データを保持するデータ転送オブジェクト
 *
 * @author pitvia
 * @version 1.0
 */
public record RecentMaintenance(

        /**
         * 整備記録ID
         */
        UUID maintenanceId,

        /**
         * 車両名（例: 'RX-7', 'GTR' 等）
         */
        String vehicleName,

        /**
         * 車両保有者のユーザー名
         */
        String ownerName,

        /**
         * 整備種別
         */
        MaintenanceType maintenanceType,

        /**
         * 整備タイトル(例：オイル交換、ECUチューニング対応)
         */
        String title,

        /**
         * 整備開始日
         */
        LocalDate workDateFrom,

        /**
         * 整備終了日（単日作業の場合はnull）
         */
        LocalDate workDateTo,

        /**
         * 整備にかかった総費用（工賃＋部品代の合算値）
         */
        long totalCost,

        /**
         * 整備を担当したショップ名（DIYによる整備の場合は null）
         */
        String shopName) {
}
