package com.pitvia.api.maintenance.repository.projection;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * ダッシュボードおよび一覧表示用の「最近の整備履歴」情報を保持するプロジェクション
 *
 * @author pitvia
 * @version 1.0
 */
public interface RecentMaintenanceProjection {

    /**
     * 整備記録IDを取得する
     */
    UUID getId();

    /**
     * 整備タイトルを取得する
     */
    String getTitle();

    /**
     * 整備種別名（例: '車検', '定期メンテナンス'）を取得する
     */
    String getMaintenanceTypeName();

    /**
     * 整備開始日を取得する
     */
    LocalDate getWorkDateFrom();

    /**
     * 車両表示名（愛称など）を取得する
     */
    String getVehicleName();

    /**
     * 整備を実施したショップ名（DIYの場合は null）
     */
    String getShopName();

    /**
     * 整備にかかった総費用（工賃＋部品代）を取得する
     */
    BigDecimal getTotalCost();
}
