package com.pitvia.api.maintenance.dto.response;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.pitvia.api.maintenance.entity.MaintenanceRecord;
import com.pitvia.api.maintenance.enums.MaintenanceType;
import com.pitvia.api.storage.resolver.StorageUrlResolver;

/**
 * 整備履歴詳細情報レスポンスDTO
 *
 * @author pitvia
 * @version 1.0
 */
public record MaintenanceRecordResponse(

        /**
         * 整備記録ID
         */
        UUID id,

        /**
         * 対象車両ID
         */
        UUID vehicleId,

        /**
         * 車種名（例: RX-7, GT-R）
         */
        String vehicleModelName,

        /**
         * 型式（例: FD3S, R32）
         */
        String vehicleModelCode,

        /**
         * 整備タイトル
         */
        String title,

        /**
         * 整備種別
         */
        MaintenanceType maintenanceType,

        /**
         * 整備開始日
         */
        LocalDate workDateFrom,

        /**
         * 整備終了日（単日作業の場合はnull）
         */
        LocalDate workDateTo,

        /**
         * 整備実施時の積算走行距離 (km)
         */
        Integer mileage,

        /**
         * 総合備考 / 特記事項
         */
        String remarks,

        /**
         * 整備を実施したショップ名（DIYの場合はnull）
         */
        String shopName,

        /**
         * 紐づく作業明細リスト（表示順）
         */
        List<WorkItemResponse> workItems,

        /**
         * ログインユーザーがこの整備履歴を編集（更新・削除）できるかどうか
         *
         * <p>
         * 車両所有者/SHOP権限ではなく、この整備履歴を登録したユーザー本人かどうかで判定される。
         * </p>
         */
        boolean canEdit) {

    /**
     * エンティティから生成する
     *
     * <p>
     * 画像のストレージキーは、この変換処理の中で公開URLへ解決する。{@code vehicle}/{@code shop}/
     * {@code workItems}は遅延ロードのため、本メソッドは呼び出し元のトランザクション内で実行すること。
     * </p>
     *
     * @param record             整備記録エンティティ
     * @param storageUrlResolver 公開URL組み立てクラス
     * @param canEdit            ログインユーザーがこの整備履歴を編集できるかどうか
     * @return MaintenanceRecordResponse
     */
    public static MaintenanceRecordResponse from(
            MaintenanceRecord record, StorageUrlResolver storageUrlResolver, boolean canEdit) {

        // DIYの場合はshopがnullのため、その場合はショップ名もnullとする
        String shopName = record.getShop() != null ? record.getShop().getUser().getUserName() : null;

        return new MaintenanceRecordResponse(
                record.getId(),
                record.getVehicle().getId(),
                record.getVehicle().getModelName(),
                record.getVehicle().getModelCode(),
                record.getTitle(),
                MaintenanceType.fromCode(record.getMaintenanceType().getCode()),
                record.getWorkDateFrom(),
                record.getWorkDateTo(),
                record.getMileage(),
                record.getRemarks(),
                shopName,
                record.getWorkItems().stream().map(workItem -> WorkItemResponse.from(workItem, storageUrlResolver)).toList(),
                canEdit);
    }
}
