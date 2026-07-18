package com.pitvia.api.vehicle.repository.projection;

/**
 * ショップ管理車両サマリー用プロジェクション
 *
 * @author pitvia
 * @version 1.0
 */
public interface ManagedVehicleSummaryProjection {

    /**
     * 自社所有かつ顧客車両を含めた、管理車両の総数を取得する
     */
    Long getTotalCount();

    /**
     * ショップ自身が所有する車両数を取得する
     */
    Long getOwnCount();

    /**
     * 連携している顧客が所有する車両数を取得する
     */
    Long getCustomerCount();
}
