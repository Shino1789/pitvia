package com.pitvia.api.maintenance.repository.projection;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * 整備履歴一覧表示用の情報を保持するプロジェクション
 *
 * @author pitvia
 * @version 1.0
 */
public interface MaintenanceRecordListProjection {

    /**
     * 整備記録IDを取得する
     */
    UUID getId();

    /**
     * 対象車両IDを取得する
     */
    UUID getVehicleId();

    /**
     * 車種名（例: RX-7, GT-R）を取得する
     */
    String getVehicleModelName();

    /**
     * 型式（例: FD3S, R32）を取得する
     */
    String getVehicleModelCode();

    /**
     * 整備種別コードを取得する
     */
    String getMaintenanceTypeCode();

    /**
     * 整備タイトルを取得する
     */
    String getTitle();

    /**
     * 整備開始日を取得する
     */
    LocalDate getWorkDateFrom();

    /**
     * 整備終了日を取得する（単日作業の場合は null）
     */
    LocalDate getWorkDateTo();

    /**
     * 整備実施時の積算走行距離 (km) を取得する
     */
    Integer getMileage();

    /**
     * 整備にかかった総費用（工賃＋部品代）を取得する
     */
    BigDecimal getTotalCost();

    /**
     * 整備を実施したショップ名（DIYの場合は null）
     */
    String getShopName();
}
