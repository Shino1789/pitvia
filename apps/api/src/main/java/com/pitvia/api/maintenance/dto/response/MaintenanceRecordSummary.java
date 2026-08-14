package com.pitvia.api.maintenance.dto.response;

import java.time.LocalDate;
import java.util.UUID;

import com.pitvia.api.maintenance.enums.MaintenanceType;
import com.pitvia.api.maintenance.repository.projection.MaintenanceRecordListProjection;

/**
 * 整備履歴一覧の1件分のレスポンスDTO
 *
 * @author pitvia
 * @version 1.0
 */
public record MaintenanceRecordSummary(

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
         * 整備種別
         */
        MaintenanceType maintenanceType,

        /**
         * 整備タイトル
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
         * 整備実施時の積算走行距離 (km)
         */
        Integer mileage,

        /**
         * 整備にかかった総費用（工賃＋部品代の合算値）
         */
        long totalCost,

        /**
         * 整備を実施したショップ名（DIYの場合はnull）
         */
        String shopName) {

    /**
     * プロジェクションから生成する
     *
     * @param projection 整備履歴一覧プロジェクション
     * @return MaintenanceRecordSummary
     */
    public static MaintenanceRecordSummary from(MaintenanceRecordListProjection projection) {
        return new MaintenanceRecordSummary(
                projection.getId(),
                projection.getVehicleId(),
                projection.getVehicleModelName(),
                projection.getVehicleModelCode(),
                MaintenanceType.fromCode(projection.getMaintenanceTypeCode()),
                projection.getTitle(),
                projection.getWorkDateFrom(),
                projection.getWorkDateTo(),
                projection.getMileage(),
                projection.getTotalCost().longValue(),
                projection.getShopName());
    }
}
